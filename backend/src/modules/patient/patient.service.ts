import type { Prisma } from '@prisma/client'
import { prisma } from '../../config/prisma.ts'
import { AppError } from '../../utils/AppError.ts'
import { safeDecrypt } from '../../utils/crypto.ts'
import { getPagination } from '../../utils/pagination.ts'
import type { ListQuery, UpdateProfileInput } from './patient.schema.ts'

async function getPatientOrThrow(userId: string) {
  const patient = await prisma.patient.findUnique({
    where: { userId },
    include: { user: { select: { email: true, phone: true } } },
  })
  if (!patient) throw AppError.forbidden('Patient profile not found')
  return patient
}

// ---------------------------------------------------------------- profile

export async function getProfile(userId: string) {
  const p = await getPatientOrThrow(userId)
  return {
    id: p.id,
    uhid: p.uhid,
    nid: p.nid,
    fullName: p.fullName,
    email: p.user.email,
    phone: p.user.phone,
    dateOfBirth: p.dateOfBirth,
    gender: p.gender,
    bloodGroup: p.bloodGroup,
    allergies: p.allergies,
    chronicDiseases: p.chronicDiseases,
    createdAt: p.createdAt,
  }
}

export async function updateProfile(userId: string, input: UpdateProfileInput) {
  const p = await getPatientOrThrow(userId)

  const data: Prisma.PatientUpdateInput = {
    ...(input.fullName !== undefined ? { fullName: input.fullName } : {}),
    ...(input.dateOfBirth !== undefined ? { dateOfBirth: input.dateOfBirth } : {}),
    ...(input.gender !== undefined ? { gender: input.gender } : {}),
    ...(input.bloodGroup !== undefined ? { bloodGroup: input.bloodGroup } : {}),
    ...(input.allergies !== undefined
      ? { allergies: input.allergies as Prisma.InputJsonValue }
      : {}),
    ...(input.chronicDiseases !== undefined
      ? { chronicDiseases: input.chronicDiseases as Prisma.InputJsonValue }
      : {}),
  }

  const updated = await prisma.patient.update({ where: { id: p.id }, data })

  return {
    id: updated.id,
    fullName: updated.fullName,
    dateOfBirth: updated.dateOfBirth,
    gender: updated.gender,
    bloodGroup: updated.bloodGroup,
    allergies: updated.allergies,
    chronicDiseases: updated.chronicDiseases,
  }
}

// ---------------------------------------------------------------- records

export async function getRecords(userId: string, query: ListQuery) {
  const p = await getPatientOrThrow(userId)
  const { skip, take, page, limit } = getPagination(query)

  const [total, records] = await Promise.all([
    prisma.medicalRecord.count({ where: { patientId: p.id } }),
    prisma.medicalRecord.findMany({
      where: { patientId: p.id },
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: {
        prescriptions: true,
        doctor: { select: { fullName: true, specialization: true } },
      },
    }),
  ])

  const data = records.map((r) => ({
    id: r.id,
    diagnosis: r.diagnosis,
    content: safeDecrypt(r.contentEncrypted),
    symptoms: r.symptoms,
    followUpDate: r.followUpDate,
    createdAt: r.createdAt,
    doctor: r.doctor,
    prescriptions: r.prescriptions.map((x) => ({
      id: x.id,
      medications: x.medications,
      recommendedTests: x.recommendedTests,
      notes: x.notes,
      createdAt: x.createdAt,
    })),
  }))

  return { data, meta: { total, page, limit } }
}

export async function getRecordById(userId: string, recordId: string) {
  const p = await getPatientOrThrow(userId)

  const record = await prisma.medicalRecord.findFirst({
    where: { id: recordId, patientId: p.id },
    include: {
      prescriptions: true,
      aiSummaries: true,
      doctor: { select: { fullName: true, specialization: true } },
    },
  })
  if (!record) throw AppError.notFound('Record not found')

  return {
    id: record.id,
    diagnosis: record.diagnosis,
    content: safeDecrypt(record.contentEncrypted),
    symptoms: record.symptoms,
    followUpDate: record.followUpDate,
    createdAt: record.createdAt,
    doctor: record.doctor,
    prescriptions: record.prescriptions,
    aiSummaries: record.aiSummaries,
  }
}

// ---------------------------------------------------------------- lab reports

export async function getLabReports(userId: string, query: ListQuery) {
  const p = await getPatientOrThrow(userId)
  const { skip, take, page, limit } = getPagination(query)

  const [total, reports] = await Promise.all([
    prisma.labReport.count({ where: { patientId: p.id } }),
    prisma.labReport.findMany({
      where: { patientId: p.id },
      skip,
      take,
      orderBy: { uploadedAt: 'desc' },
      include: { lab: { select: { centerName: true } } },
    }),
  ])

  const data = reports.map((r) => ({
    id: r.id,
    testName: r.testName,
    fileRef: safeDecrypt(r.fileRefEncrypted),
    lab: r.lab.centerName,
    isVerified: r.isVerified,
    uploadedAt: r.uploadedAt,
  }))

  return { data, meta: { total, page, limit } }
}

// ---------------------------------------------------------------- audit ("who saw my data")

function actorDisplayName(actor: {
  email: string
  doctor: { fullName: string } | null
  lab: { centerName: string } | null
  admin: { fullName: string } | null
}): string {
  return actor.doctor?.fullName ?? actor.lab?.centerName ?? actor.admin?.fullName ?? actor.email
}

export async function getAudit(userId: string, query: ListQuery) {
  const p = await getPatientOrThrow(userId)
  const { skip, take, page, limit } = getPagination(query)

  const [total, logs] = await Promise.all([
    prisma.auditLog.count({ where: { patientId: p.id } }),
    prisma.auditLog.findMany({
      where: { patientId: p.id },
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: {
        actor: {
          select: {
            email: true,
            role: true,
            doctor: { select: { fullName: true } },
            lab: { select: { centerName: true } },
            admin: { select: { fullName: true } },
          },
        },
      },
    }),
  ])

  const data = logs.map((log) => ({
    id: log.id,
    action: log.action,
    by: actorDisplayName(log.actor),
    role: log.actor.role,
    resource: log.resource,
    at: log.createdAt,
  }))

  return { data, meta: { total, page, limit } }
}
