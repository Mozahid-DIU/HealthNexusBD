import { prisma } from '../../config/prisma.ts'
import { AppError } from '../../utils/AppError.ts'
import { getPagination } from '../../utils/pagination.ts'
import { writeAudit } from '../../utils/audit.ts'
import { readReportFile, storeReportFile } from '../../services/reportFiles.ts'
import { notifyLabReportReady } from '../../services/notifications.ts'
import type { ListQuery, SearchQuery, UploadReportInput } from './lab.schema.ts'

/** Resolve the calling lab and ensure the account is approved/active. */
async function getActiveLab(userId: string) {
  const lab = await prisma.diagnosticLab.findUnique({ where: { userId }, include: { user: true } })
  if (!lab) throw AppError.forbidden('Lab profile not found')
  if (lab.user.status !== 'active') {
    throw AppError.forbidden('Your lab account is pending approval')
  }
  return lab
}

/** Collect the distinct tests recommended across a patient's prescriptions. */
async function prescribedTestNames(patientId: string): Promise<string[]> {
  const prescriptions = await prisma.prescription.findMany({
    where: { record: { patientId } },
    select: { recommendedTests: true },
  })
  const tests = new Set<string>()
  for (const p of prescriptions) {
    const arr = Array.isArray(p.recommendedTests) ? p.recommendedTests : []
    for (const t of arr) if (typeof t === 'string') tests.add(t)
  }
  return [...tests]
}

// ---------------------------------------------------------------- search

export async function searchPatient(userId: string, query: SearchQuery) {
  await getActiveLab(userId)

  const patient = await prisma.patient.findFirst({
    where: query.uhid ? { uhid: query.uhid } : { user: { phone: query.phone } },
  })
  if (!patient) throw AppError.notFound('No patient found')

  const [names, reports] = await Promise.all([
    prescribedTestNames(patient.id),
    prisma.labReport.findMany({ where: { patientId: patient.id }, select: { testName: true } }),
  ])
  const uploaded = new Set(reports.map((r) => r.testName))

  // Labs see ONLY the prescribed tests — never the patient's clinical history.
  return {
    patientId: patient.id,
    uhid: patient.uhid,
    fullName: patient.fullName,
    prescribedTests: names.map((name) => ({
      name,
      status: uploaded.has(name) ? 'uploaded' : 'pending',
    })),
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
    throw AppError.badRequest('The uploaded file is not a valid PDF')
  }

  const patient = await prisma.patient.findUnique({ where: { uhid: input.uhid } })
  if (!patient) throw AppError.notFound('No patient found with this UHID')

  // Enforce the core rule: a lab may only upload a report for a PRESCRIBED test.
  const prescription = await prisma.prescription.findFirst({
    where: {
      record: { patientId: patient.id },
      recommendedTests: { array_contains: input.testName },
    },
    select: { recordId: true },
  })
  if (!prescription) {
    throw AppError.forbidden(`"${input.testName}" was not prescribed for this patient`)
  }

  // The PDF is AES-encrypted before upload; the DB keeps only an encrypted ref to it.
  const fileRefEncrypted = await storeReportFile(fileBuffer)

  const report = await prisma.labReport.create({
    data: {
      patientId: patient.id,
      labId: lab.id,
      recordId: prescription.recordId,
      testName: input.testName,
      fileRefEncrypted,
    },
  })

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
