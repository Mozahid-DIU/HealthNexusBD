import { getDocumentProxy } from 'unpdf'
import { prisma } from '../../config/prisma.ts'
import { AppError } from '../../utils/AppError.ts'
import { safeDecrypt } from '../../utils/crypto.ts'
import { logger } from '../../utils/logger.ts'
import { readReportFile } from '../../services/reportFiles.ts'
import { deidentifyNote } from '../../services/ai.ts'

/**
 * What the assistant may know, DE-IDENTIFIED: clinical facts only. The patient's name,
 * UHID, NID, phone and email never leave the server, even inside free text or a PDF.
 */

/** Report text beyond this is cut: a lab report's values fit well within it. */
const MAX_REPORT_CHARS = 6000

export interface PatientFacts {
  patientId: string
  fullName: string
  age: number | null
  gender: string | null
  allergies: string[]
  chronic: string[]
}

export interface Attachment {
  kind: 'record' | 'labReport'
  id: string
  /** Shown back to the patient, e.g. "Type 2 Diabetes Mellitus" or "CBC". */
  title: string
  /** The de-identified text the model reads. */
  context: string
}

const list = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string') : []

const day = (date: Date) => date.toISOString().slice(0, 10)

function ageOn(dob: Date | null, now = new Date()): number | null {
  if (!dob) return null
  let age = now.getUTCFullYear() - dob.getUTCFullYear()
  if (now.getUTCMonth() < dob.getUTCMonth() || (now.getUTCMonth() === dob.getUTCMonth() && now.getUTCDate() < dob.getUTCDate())) age -= 1
  return age
}

export async function patientFacts(userId: string): Promise<PatientFacts> {
  const p = await prisma.patient.findUnique({
    where: { userId },
    select: { id: true, fullName: true, dateOfBirth: true, gender: true, allergies: true, chronicDiseases: true },
  })
  if (!p) throw AppError.forbidden('Patient profile not found')
  return {
    patientId: p.id,
    fullName: p.fullName,
    age: ageOn(p.dateOfBirth),
    gender: p.gender,
    allergies: list(p.allergies),
    chronic: list(p.chronicDiseases),
  }
}

/** The always-on background: age, sex, allergies and long-term conditions. */
export function profileContext(facts: PatientFacts): string {
  return [
    `Age: ${facts.age ?? 'unknown'}; sex: ${facts.gender ?? 'unknown'}`,
    `Known allergies: ${facts.allergies.join(', ') || 'none recorded'}`,
    `Long-term conditions: ${facts.chronic.join(', ') || 'none recorded'}`,
  ].join('\n')
}

function medicineLine(m: unknown): string | null {
  if (!m || typeof m !== 'object') return null
  const { name, dose, frequency, duration } = m as Record<string, unknown>
  if (typeof name !== 'string') return null
  return [name, dose, frequency, duration].filter((v) => typeof v === 'string' && v).join(', ')
}

async function recordAttachment(facts: PatientFacts, id: string): Promise<Attachment> {
  const record = await prisma.medicalRecord.findFirst({
    where: { id, patientId: facts.patientId },
    include: { prescriptions: true, doctor: { select: { specialization: true } } },
  })
  if (!record) throw AppError.notFound('Record not found')

  const scrub = (text: string) => deidentifyNote(text, [facts.fullName])
  const medicines = record.prescriptions.flatMap((p) => (Array.isArray(p.medications) ? p.medications : []).map(medicineLine))
  const tests = record.prescriptions.flatMap((p) => list(p.recommendedTests))
  const notes = record.prescriptions.map((p) => p.notes).filter((n): n is string => Boolean(n))

  const context = [
    `Visit on ${day(record.createdAt)}${record.doctor?.specialization ? ` with a ${record.doctor.specialization}` : ''}`,
    `Diagnosis: ${record.diagnosis ?? 'not recorded'}`,
    `Symptoms: ${list(record.symptoms).join(', ') || 'none recorded'}`,
    `Doctor's note: ${scrub(safeDecrypt(record.contentEncrypted)) || 'none'}`,
    `Medicines: ${medicines.filter(Boolean).join('; ') || 'none'}`,
    `Tests ordered: ${tests.join(', ') || 'none'}`,
    ...(notes.length ? [`Prescription notes: ${scrub(notes.join(' '))}`] : []),
    ...(record.followUpDate ? [`Follow-up date: ${day(record.followUpDate)}`] : []),
  ].join('\n')

  return { kind: 'record', id, title: record.diagnosis ?? day(record.createdAt), context }
}

/** A lab report's values sit on its first pages; a long PDF is not read further. */
const MAX_PDF_PAGES = 5
const PDF_TIMEOUT_MS = 8000
/** Reports never change, so their de-identified text is reused for a while. */
const REPORT_TEXT_TTL_MS = 30 * 60 * 1000
const REPORT_TEXT_MAX = 100
const reportTextCache = new Map<string, { text: string; expires: number }>()

/** Test hook: forget cached report text. */
export function clearReportTextCache(): void {
  reportTextCache.clear()
}

async function readPages(pdf: Buffer): Promise<string> {
  const doc = await getDocumentProxy(new Uint8Array(pdf), { verbosity: 0 })
  try {
    const pages: string[] = []
    for (let n = 1; n <= Math.min(doc.numPages, MAX_PDF_PAGES); n++) {
      const content = await (await doc.getPage(n)).getTextContent()
      pages.push(content.items.map((item) => ('str' in item ? item.str + (item.hasEOL ? '\n' : ' ') : '')).join(''))
    }
    return pages.join('\n')
  } finally {
    void doc.loadingTask.destroy()
  }
}

/** Text of a PDF's first pages, or '' when it has none (e.g. a scanned image), is unreadable or too slow. */
export async function pdfText(pdf: Buffer): Promise<string> {
  let timer: NodeJS.Timeout | undefined
  try {
    const timeout = new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(new Error('PDF read timed out')), PDF_TIMEOUT_MS)
    })
    const text = await Promise.race([readPages(pdf), timeout])
    return text.replace(/[ \t]+/g, ' ').replace(/ *\n */g, '\n').replace(/\n{3,}/g, '\n\n').trim()
  } catch (err) {
    logger.warn({ reason: err instanceof Error ? err.message.slice(0, 60) : 'unknown' }, 'Could not read lab report text')
    return ''
  } finally {
    clearTimeout(timer)
  }
}

async function reportText(reportId: string, fileRef: string, patientName: string): Promise<string> {
  const cached = reportTextCache.get(reportId)
  if (cached && cached.expires > Date.now()) return cached.text
  const text = deidentifyNote(await pdfText(await readReportFile(fileRef)), [patientName]).slice(0, MAX_REPORT_CHARS)
  if (reportTextCache.size >= REPORT_TEXT_MAX) {
    const oldest = reportTextCache.keys().next().value
    if (oldest !== undefined) reportTextCache.delete(oldest)
  }
  reportTextCache.set(reportId, { text, expires: Date.now() + REPORT_TEXT_TTL_MS })
  return text
}

async function labReportAttachment(facts: PatientFacts, id: string): Promise<Attachment> {
  const report = await prisma.labReport.findFirst({
    where: { id, patientId: facts.patientId },
    include: { lab: { select: { centerName: true } } },
  })
  if (!report) throw AppError.notFound('Lab report not found')

  const text = await reportText(report.id, report.fileRefEncrypted, facts.fullName)
  const body = text
    ? text.slice(0, MAX_REPORT_CHARS)
    : '(The report has no readable text: it may be a scanned image. Say so, and suggest asking the doctor or lab.)'

  const context = [`Lab report: ${report.testName}, from ${day(report.uploadedAt)}`, 'Report text:', body].join('\n')
  return { kind: 'labReport', id, title: report.testName, context }
}

export function buildAttachment(facts: PatientFacts, attachment: { kind: 'record' | 'labReport'; id: string }) {
  return attachment.kind === 'record' ? recordAttachment(facts, attachment.id) : labReportAttachment(facts, attachment.id)
}
