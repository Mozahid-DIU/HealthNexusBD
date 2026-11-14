import { prisma } from '../../config/prisma.ts'
import { writeAuditOnce } from '../../utils/audit.ts'
import { generateOverview, type OverviewContext, type OverviewResult } from '../../services/ai.ts'
import { asStringArray, assertConsent, getActiveDoctor } from './doctor.service.ts'

/** Visits and lab tests the overview reads: enough for a briefing, bounded for the prompt. */
const MAX_VISITS = 12
const MAX_LAB_TESTS = 8
/** One audit entry per doctor and patient in this window, however often the chart reloads. */
const AUDIT_WINDOW_MS = 10 * 60 * 1000
/** Reuse an answer while the history is unchanged, so reopening a chart costs no AI call. */
const CACHE_TTL_MS = 30 * 60 * 1000
const CACHE_MAX = 500
/** Prescriptions this recent count as what the patient may be taking now. */
const CURRENT_MEDICINES_DAYS = 90

interface CachedOverview {
  input: string
  result: OverviewResult
  generatedAt: Date
  expires: number
}

const cache = new Map<string, CachedOverview>()

/** Test hook: forget every cached overview. */
export function clearOverviewCache(): void {
  cache.clear()
}

const month = (date: Date) => date.toISOString().slice(0, 7)

function ageOn(dateOfBirth: Date | null, now: Date): number | null {
  if (!dateOfBirth) return null
  let age = now.getUTCFullYear() - dateOfBirth.getUTCFullYear()
  const beforeBirthday =
    now.getUTCMonth() < dateOfBirth.getUTCMonth() ||
    (now.getUTCMonth() === dateOfBirth.getUTCMonth() && now.getUTCDate() < dateOfBirth.getUTCDate())
  if (beforeBirthday) age -= 1
  return age
}

function medicineNames(medications: unknown): string[] {
  return asStringArray((Array.isArray(medications) ? medications : []).map((m) => (m as { name?: unknown })?.name))
}

/**
 * The patient's history, DE-IDENTIFIED for the AI: clinical facts only. Name, UHID, NID,
 * contact details and the free-text clinical notes never leave the server.
 */
async function buildContext(patientId: string): Promise<OverviewContext> {
  const [patient, totalVisits, records, labReports] = await Promise.all([
    prisma.patient.findUniqueOrThrow({
      where: { id: patientId },
      select: { dateOfBirth: true, gender: true, allergies: true, chronicDiseases: true },
    }),
    prisma.medicalRecord.count({ where: { patientId } }),
    prisma.medicalRecord.findMany({
      where: { patientId },
      orderBy: { createdAt: 'desc' },
      take: MAX_VISITS,
      select: {
        diagnosis: true,
        symptoms: true,
        createdAt: true,
        // A stable order keeps the cache key stable too.
        prescriptions: { select: { medications: true }, orderBy: { createdAt: 'asc' } },
      },
    }),
    prisma.labReport.findMany({
      where: { patientId },
      orderBy: { uploadedAt: 'desc' },
      take: MAX_LAB_TESTS,
      select: { testName: true, uploadedAt: true },
    }),
  ])

  const now = new Date()
  const visits = records.map((r) => ({
    at: r.createdAt,
    month: month(r.createdAt),
    diagnosis: r.diagnosis,
    symptoms: asStringArray(r.symptoms),
    medications: r.prescriptions.flatMap((p) => medicineNames(p.medications)),
  }))
  // Medicines from different recent visits are taken together, so check them together.
  const recentSince = now.getTime() - CURRENT_MEDICINES_DAYS * 24 * 60 * 60 * 1000
  const currentMedications = [
    ...new Set(visits.filter((v) => v.at.getTime() >= recentSince).flatMap((v) => v.medications)),
  ]

  return {
    age: ageOn(patient.dateOfBirth, now),
    gender: patient.gender,
    allergies: asStringArray(patient.allergies),
    chronic: asStringArray(patient.chronicDiseases),
    totalVisits,
    currentMedications,
    visits: visits.map(({ at: _at, ...visit }) => visit),
    labTests: labReports.map((l) => ({ month: month(l.uploadedAt), test: l.testName })),
  }
}

function remember(patientId: string, entry: CachedOverview) {
  // Expired answers are clinical data with no use left: drop them rather than keep them in memory.
  const now = Date.now()
  for (const [key, cached] of cache) if (cached.expires <= now) cache.delete(key)
  if (cache.size >= CACHE_MAX && !cache.has(patientId)) {
    const oldest = cache.keys().next().value
    if (oldest !== undefined) cache.delete(oldest)
  }
  cache.set(patientId, entry)
}

/** UC-06: an AI briefing on the patient's whole history, for a doctor with live consent. */
export async function getAiOverview(userId: string, patientId: string, ip?: string | null) {
  const doctor = await getActiveDoctor(userId)
  await assertConsent(doctor.id, patientId)

  const context = await buildContext(patientId)
  const input = JSON.stringify(context)
  const cached = cache.get(patientId)
  const now = Date.now()

  let entry: CachedOverview
  if (cached && cached.input === input && cached.expires > now) {
    entry = cached
  } else {
    entry = { input, result: await generateOverview(context), generatedAt: new Date(), expires: now + CACHE_TTL_MS }
    remember(patientId, entry)
  }

  await writeAuditOnce(
    { actorUserId: userId, action: 'view', patientId, resource: 'ai_overview', ipAddress: ip ?? null },
    AUDIT_WINDOW_MS,
  )

  return { ...entry.result, visitCount: context.totalVisits, generatedAt: entry.generatedAt }
}
