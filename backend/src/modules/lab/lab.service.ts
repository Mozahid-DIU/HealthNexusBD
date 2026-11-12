import { prisma } from '../../config/prisma.ts'
import { AppError } from '../../utils/AppError.ts'
import { getPagination } from '../../utils/pagination.ts'
import { auditPatientSearch, writeAudit } from '../../utils/audit.ts'
import { cleanTestName, testKey } from '../../utils/testName.ts'
import { discardReportFile, readReportFile, storeReportFile } from '../../services/reportFiles.ts'
import { notifyLabReportReady } from '../../services/notifications.ts'
import type { ListQuery, SearchQuery, UploadReportInput } from './lab.schema.ts'

/** Resolve the calling lab and ensure the account is approved/active. */
async function getActiveLab(userId: string) {
  const lab = await prisma.diagnosticLab.findUnique({ where: { userId }, include: { user: true } })
  if (!lab) throw AppError.forbidden('Lab profile not found')
  if (lab.user.status !== 'active') {
    throw AppError.forbidden('Your lab account is pending approval', 'ACCOUNT_PENDING')
  }
  return lab
}

interface OrderedTest {
  /** As written in the latest prescription (tidied), for display and storage. */
  name: string
  prescribedAt: Date
  recordId: string
}

/**
 * Each distinct test recommended for a patient (by `testKey`, so "CBC" and "cbc " are
 * one test), taken from its most recent prescription.
 */
async function latestPrescribedTests(patientId: string): Promise<Map<string, OrderedTest>> {
  const prescriptions = await prisma.prescription.findMany({
    where: { record: { patientId } },
    select: { recommendedTests: true, createdAt: true, recordId: true },
    orderBy: { createdAt: 'desc' },
  })
  const latest = new Map<string, OrderedTest>()
  for (const p of prescriptions) {
    const tests = Array.isArray(p.recommendedTests) ? p.recommendedTests : []
    for (const t of tests) {
      if (typeof t !== 'string' || !cleanTestName(t)) continue
      const key = testKey(t)
      if (!latest.has(key)) latest.set(key, { name: cleanTestName(t), prescribedAt: p.createdAt, recordId: p.recordId })
    }
  }
  return latest
}

/** Show only the last 3 digits of a phone number for identification. */
function maskPhone(phone: string): string {
  return phone.length <= 3 ? phone : `${'*'.repeat(phone.length - 3)}${phone.slice(-3)}`
}

// ---------------------------------------------------------------- search

export async function searchPatient(userId: string, query: SearchQuery, ip?: string | null) {
  await getActiveLab(userId)

  const patient = await prisma.patient.findFirst({
    where: query.uhid ? { uhid: query.uhid } : { user: { phone: query.phone } },
    include: { user: { select: { phone: true } } },
  })
  if (!patient) throw AppError.notFound('No patient found')

  const [prescribed, reports] = await Promise.all([
    latestPrescribedTests(patient.id),
    prisma.labReport.findMany({
      where: { patientId: patient.id },
      select: { testName: true, uploadedAt: true },
    }),
  ])
  const lastUpload = new Map<string, Date>()
  for (const r of reports) {
    const key = testKey(r.testName)
    const seen = lastUpload.get(key)
    if (!seen || r.uploadedAt > seen) lastUpload.set(key, r.uploadedAt)
  }

  // A test is done once a report arrived after its latest prescription; prescribing it
  // again (a repeat HbA1c, say) makes it pending again. Pending tests come first.
  // Reports from any lab count: the patient needs the result, not a second sample.
  const tests = [...prescribed].map(([key, test]) => {
    const uploadedAt = lastUpload.get(key)
    const status = uploadedAt && uploadedAt >= test.prescribedAt ? 'uploaded' : 'pending'
    return { name: test.name, status, prescribedAt: test.prescribedAt }
  })
  tests.sort((a, b) => (a.status === b.status ? 0 : a.status === 'pending' ? -1 : 1))

  await auditPatientSearch(userId, patient.id, ip)

  // Labs see ONLY the prescribed tests — never the patient's clinical history. The
  // masked phone and gender let the counter confirm they have the right person.
  return {
    patientId: patient.id,
    uhid: patient.uhid,
    fullName: patient.fullName,
    gender: patient.gender,
    phone: maskPhone(patient.user.phone),
    prescribedTests: tests,
  }
}

// ---------------------------------------------------------------- upload report

const PDF_MAGIC = Buffer.from('%PDF-')

export async function uploadReport(
  userId: string,
  input: UploadReportInput,
  fileBuffer: Buffer,
  ip?: string | null,
) {
  const lab = await getActiveLab(userId)

  // The multer filter only trusts the client-declared mimetype; check the real bytes.
  if (!fileBuffer.subarray(0, PDF_MAGIC.length).equals(PDF_MAGIC)) {
    throw AppError.badRequest('The uploaded file is not a valid PDF', 'INVALID_FILE')
  }

  const patient = await prisma.patient.findUnique({ where: { uhid: input.uhid } })
  if (!patient) throw AppError.notFound('No patient found with this UHID')

  // Enforce the core rule: a lab may only upload a report for a PRESCRIBED test. The
  // report belongs to the visit that most recently asked for it, under its name.
  const ordered = (await latestPrescribedTests(patient.id)).get(testKey(input.testName))
  if (!ordered) {
    throw AppError.forbidden(`"${input.testName}" was not prescribed for this patient`, 'TEST_NOT_PRESCRIBED')
  }

  // The PDF is AES-encrypted before upload; the DB keeps only an encrypted ref to it.
  const fileRefEncrypted = await storeReportFile(fileBuffer)

  let report
  try {
    report = await prisma.labReport.create({
      data: {
        patientId: patient.id,
        labId: lab.id,
        recordId: ordered.recordId,
        testName: ordered.name,
        fileRefEncrypted,
      },
    })
  } catch (err) {
    // Nothing points at the stored file now; don't leave it behind.
    await discardReportFile(fileRefEncrypted)
    throw err
  }

  await writeAudit({
    actorUserId: userId,
    action: 'create',
    patientId: patient.id,
    resource: `lab_report:${report.id}`,
    ipAddress: ip ?? null,
  })

  // FR-21: in-app + SMS. Best-effort; never fails the upload.
  await notifyLabReportReady({ patientId: patient.id, testName: report.testName, labName: lab.centerName })

  return { id: report.id, testName: report.testName, uploadedAt: report.uploadedAt }
}

// ---------------------------------------------------------------- my uploads

export async function listUploads(userId: string, query: ListQuery) {
  const lab = await getActiveLab(userId)
  const { skip, take, page, limit } = getPagination(query)

  const [total, reports] = await Promise.all([
    prisma.labReport.count({ where: { labId: lab.id } }),
    prisma.labReport.findMany({
      where: { labId: lab.id },
      skip,
      take,
      orderBy: { uploadedAt: 'desc' },
      include: { patient: { select: { uhid: true, fullName: true } } },
    }),
  ])

  const data = reports.map((r) => ({
    id: r.id,
    testName: r.testName,
    patient: r.patient,
    fileUrl: `/api/lab/reports/${r.id}/file`,
    isVerified: r.isVerified,
    uploadedAt: r.uploadedAt,
  }))

  return { data, meta: { total, page, limit } }
}

// ---------------------------------------------------------------- download (own uploads only)

export async function getReportFile(userId: string, reportId: string, ip?: string | null) {
  const lab = await getActiveLab(userId)

  const report = await prisma.labReport.findFirst({ where: { id: reportId, labId: lab.id } })
  if (!report) throw AppError.notFound('Report not found')

  const pdf = await readReportFile(report.fileRefEncrypted)

  await writeAudit({
    actorUserId: userId,
    action: 'view',
    patientId: report.patientId,
    resource: `lab_report_file:${report.id}`,
    ipAddress: ip ?? null,
  })

  return { pdf, filename: report.testName }
}
