import type { Prisma } from '@prisma/client'
import { prisma } from '../../config/prisma.ts'
import { AppError } from '../../utils/AppError.ts'
import { encrypt, safeDecrypt } from '../../utils/crypto.ts'
import { getPagination } from '../../utils/pagination.ts'
import { writeAudit } from '../../utils/audit.ts'
import { getActiveAccessSession } from '../consent/consent.service.ts'
import { generateSummary } from '../../services/ai.ts'
import type { CreateRecordInput, ListQuery, PrescriptionInput, SearchQuery } from './doctor.schema.ts'

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string') : []
}

/** Resolve the calling doctor and ensure the account is verified/active. */
async function getActiveDoctor(userId: string) {
  const doctor = await prisma.doctor.findUnique({ where: { userId }, include: { user: true } })
  if (!doctor) throw AppError.forbidden('Doctor profile not found')
  if (doctor.user.status !== 'active') {
    throw AppError.forbidden('Your doctor account is pending verification')
  }
  return doctor
}

/** Gate any patient-data access on a live consent session. */
async function assertConsent(doctorId: string, patientId: string) {
  const session = await getActiveAccessSession(doctorId, patientId)
  if (!session) {
    throw AppError.forbidden(
      'You do not have active consent for this patient. Request access via the consent flow first.',
    )
  }
  return session
}

/** Show only the last 3 digits of a phone number for identification. */
function maskPhone(phone: string): string {
  return phone.length <= 3 ? phone : `${'*'.repeat(phone.length - 3)}${phone.slice(-3)}`
}

// ---------------------------------------------------------------- search

export async function searchPatient(userId: string, query: SearchQuery) {
  const doctor = await getActiveDoctor(userId)

  const where: Prisma.PatientWhereInput = query.uhid
    ? { uhid: query.uhid }
    : { user: { phone: query.phone } }

  const patient = await prisma.patient.findFirst({
    where,
    include: { user: { select: { phone: true } } },
  })
  if (!patient) throw AppError.notFound('No patient found')

  const session = await getActiveAccessSession(doctor.id, patient.id)

  return {
    patientId: patient.id,
    uhid: patient.uhid,
    fullName: patient.fullName,
    gender: patient.gender,
    phone: maskPhone(patient.user.phone),
    hasActiveConsent: Boolean(session),
    consentExpiresAt: session?.expiresAt ?? null,
  }
}

// ---------------------------------------------------------------- my patients

export async function listMyPatients(userId: string) {
  const doctor = await getActiveDoctor(userId)

  const sessions = await prisma.accessSession.findMany({
    where: { doctorId: doctor.id, status: 'active', expiresAt: { gt: new Date() } },
    include: {
      patient: { select: { id: true, uhid: true, fullName: true, gender: true, bloodGroup: true } },
    },
    orderBy: { grantedAt: 'desc' },
  })

  return sessions.map((s) => ({ ...s.patient, consentExpiresAt: s.expiresAt }))
}

// ---------------------------------------------------------------- read records

export async function getPatientRecords(
  userId: string,
  patientId: string,
  query: ListQuery,
  ip?: string | null,
) {
  const doctor = await getActiveDoctor(userId)
  await assertConsent(doctor.id, patientId)

  const { skip, take, page, limit } = getPagination(query)
  const [total, records] = await Promise.all([
    prisma.medicalRecord.count({ where: { patientId } }),
    prisma.medicalRecord.findMany({
      where: { patientId },
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: {
        prescriptions: true,
        aiSummaries: true,
        doctor: { select: { fullName: true, specialization: true } },
      },
    }),
  ])

  await writeAudit({
    actorUserId: userId,
    action: 'view',
    patientId,
    resource: `patient_records:${records.length}`,
    ipAddress: ip ?? null,
  })

  const data = records.map((r) => ({
    id: r.id,
    diagnosis: r.diagnosis,
    content: safeDecrypt(r.contentEncrypted),
    symptoms: r.symptoms,
    isVerified: r.isVerified,
    followUpDate: r.followUpDate,
    createdAt: r.createdAt,
    author: r.doctor,
    prescriptions: r.prescriptions.map((p) => ({
      id: p.id,
      medications: p.medications,
      recommendedTests: p.recommendedTests,
      notes: p.notes,
      createdAt: p.createdAt,
    })),
    aiSummaries: r.aiSummaries,
  }))

  return { data, meta: { total, page, limit } }
}

// ---------------------------------------------------------------- create record

export async function createRecord(userId: string, input: CreateRecordInput, ip?: string | null) {
  const doctor = await getActiveDoctor(userId)

  const patient = await prisma.patient.findUnique({ where: { id: input.patientId } })
  if (!patient) throw AppError.notFound('Patient not found')
  await assertConsent(doctor.id, patient.id)

  const record = await prisma.medicalRecord.create({
    data: {
      patientId: patient.id,
      doctorId: doctor.id,
      contentEncrypted: encrypt(input.content), // AES-256-GCM at rest
      diagnosis: input.diagnosis,
      symptoms: (input.symptoms ?? []) as Prisma.InputJsonValue,
      followUpDate: input.followUpDate ?? null,
    },
  })

  await writeAudit({
    actorUserId: userId,
    action: 'create',
    patientId: patient.id,
    resource: `medical_record:${record.id}`,
    ipAddress: ip ?? null,
  })

  return {
    id: record.id,
    diagnosis: record.diagnosis,
    createdAt: record.createdAt,
  }
}

// ---------------------------------------------------------------- prescription

export async function addPrescription(
  userId: string,
  recordId: string,
  input: PrescriptionInput,
  ip?: string | null,
) {
  const doctor = await getActiveDoctor(userId)

  const record = await prisma.medicalRecord.findUnique({ where: { id: recordId } })
  if (!record) throw AppError.notFound('Medical record not found')
  if (record.doctorId !== doctor.id) {
    throw AppError.forbidden('You can only add a prescription to a record you created')
  }
  await assertConsent(doctor.id, record.patientId)

  const prescription = await prisma.prescription.create({
    data: {
      recordId: record.id,
      medications: input.medications as Prisma.InputJsonValue,
      recommendedTests: (input.recommendedTests ?? []) as Prisma.InputJsonValue,
      notes: input.notes ?? null,
    },
  })

  await writeAudit({
    actorUserId: userId,
    action: 'create',
    patientId: record.patientId,
    resource: `prescription:${prescription.id}`,
    ipAddress: ip ?? null,
  })

  return { id: prescription.id, recordId: record.id, createdAt: prescription.createdAt }
}

// ---------------------------------------------------------------- AI summary

export async function addAiSummary(userId: string, recordId: string, ip?: string | null) {
  const doctor = await getActiveDoctor(userId)

  const record = await prisma.medicalRecord.findUnique({
    where: { id: recordId },
    include: {
      prescriptions: true,
      patient: { select: { id: true, allergies: true, chronicDiseases: true } },
    },
  })
  if (!record) throw AppError.notFound('Medical record not found')
  if (record.doctorId !== doctor.id) {
    throw AppError.forbidden('You can only summarise a record you created')
  }
  await assertConsent(doctor.id, record.patientId)

  // Build a DE-IDENTIFIED context — only clinical fields, never name/UHID/NID/phone.
  const medications = record.prescriptions.flatMap((p) =>
    asStringArray((Array.isArray(p.medications) ? p.medications : []).map((m) => (m as { name?: unknown })?.name)),
  )
  const result = await generateSummary({
    diagnosis: record.diagnosis,
    content: safeDecrypt(record.contentEncrypted),
    symptoms: asStringArray(record.symptoms),
    medications,
    allergies: asStringArray(record.patient.allergies),
    chronic: asStringArray(record.patient.chronicDiseases),
  })

  const summary = await prisma.aiSummary.create({
    data: {
      recordId: record.id,
      summary: result.summary,
      interactionAlerts: result.interactionAlerts as Prisma.InputJsonValue,
      allergyAlerts: result.allergyAlerts as Prisma.InputJsonValue,
      model: result.model,
    },
  })

  await writeAudit({
    actorUserId: userId,
    action: 'create',
    patientId: record.patientId,
    resource: `ai_summary:${summary.id}`,
    ipAddress: ip ?? null,
  })

  return {
    id: summary.id,
    summary: result.summary,
    interactionAlerts: result.interactionAlerts,
    allergyAlerts: result.allergyAlerts,
    model: result.model,
    generatedAt: summary.generatedAt,
  }
}
