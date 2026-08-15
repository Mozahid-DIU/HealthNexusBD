import { prisma } from '../../config/prisma.ts'
import { AppError } from '../../utils/AppError.ts'
import { encrypt, safeDecrypt } from '../../utils/crypto.ts'
import { getPagination } from '../../utils/pagination.ts'
import { writeAudit } from '../../utils/audit.ts'
import { uploadPdf } from '../../services/storage.ts'
import type { ListQuery, UploadReportInput } from './lab.schema.ts'

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

export async function searchPatient(userId: string, uhid: string) {
  await getActiveLab(userId)

  const patient = await prisma.patient.findUnique({ where: { uhid } })
  if (!patient) throw AppError.notFound('No patient found with this UHID')

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

export async function uploadReport(
  userId: string,
  input: UploadReportInput,
  fileBuffer: Buffer,
  ip?: string | null,
) {
  const lab = await getActiveLab(userId)

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

  // Upload the PDF to Cloudinary, then store only the AES-encrypted URL.
  const { url } = await uploadPdf(fileBuffer)

  const report = await prisma.labReport.create({
    data: {
      patientId: patient.id,
      labId: lab.id,
      recordId: prescription.recordId,
      testName: input.testName,
      fileRefEncrypted: encrypt(url),
    },
  })

  await writeAudit({
    actorUserId: userId,
    action: 'create',
    patientId: patient.id,
    resource: `lab_report:${report.id}`,
    ipAddress: ip ?? null,
  })

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
    fileRef: safeDecrypt(r.fileRefEncrypted),
    isVerified: r.isVerified,
    uploadedAt: r.uploadedAt,
  }))

  return { data, meta: { total, page, limit } }
}
