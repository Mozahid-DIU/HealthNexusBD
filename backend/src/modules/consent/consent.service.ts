import { prisma } from '../../config/prisma.ts'
import { env } from '../../config/env.ts'
import { AppError } from '../../utils/AppError.ts'
import { generateOtpCode, hashOtp, verifyOtp } from '../../utils/otp.ts'
import { sendOtpSms } from '../../services/sms.ts'
import { writeAudit } from '../../utils/audit.ts'
import type { RequestAccessInput, VerifyOtpInput } from './consent.schema.ts'

/**
 * Consent + OTP engine.
 *
 * Flow:
 *   1. A verified doctor requests access to a patient by UHID  -> OTP to patient's phone.
 *   2. The patient shares that code with the doctor (their consent), or denies the request.
 *   3. The doctor submits the code -> a time-boxed AccessSession is created.
 *   4. Either side's clock (expiry) or the patient (revoke) ends the session.
 *
 * The OTP binds consent to the specific doctor who requested it (otpToken.doctorId).
 */

function minutesFromNow(mins: number): Date {
  return new Date(Date.now() + mins * 60_000)
}

/** Lazily flip any active sessions whose clock has run out to `expired`. */
async function expireStaleSessions(): Promise<void> {
  await prisma.accessSession.updateMany({
    where: { status: 'active', expiresAt: { lt: new Date() } },
    data: { status: 'expired' },
  })
}

async function getDoctorOrThrow(userId: string) {
  const doctor = await prisma.doctor.findUnique({ where: { userId }, include: { user: true } })
  if (!doctor) throw AppError.forbidden('Doctor profile not found')
  return doctor
}

async function getPatientOrThrow(userId: string) {
  const patient = await prisma.patient.findUnique({ where: { userId } })
  if (!patient) throw AppError.forbidden('Patient profile not found')
  return patient
}

// ---------------------------------------------------------------- doctor: request

export async function requestAccess(
  userId: string,
  input: RequestAccessInput,
  ipAddress?: string | null,
) {
  const doctor = await getDoctorOrThrow(userId)
  if (doctor.user.status !== 'active') {
    throw AppError.forbidden('Your doctor account is pending verification')
  }

  const patient = await prisma.patient.findUnique({
    where: { uhid: input.uhid },
    include: { user: true },
  })
  if (!patient) throw AppError.notFound('No patient found with this UHID')

  // Already have live access? No need for a new code.
  const existing = await prisma.accessSession.findFirst({
    where: {
      doctorId: doctor.id,
      patientId: patient.id,
      status: 'active',
      expiresAt: { gt: new Date() },
    },
  })
  if (existing) throw AppError.conflict('You already have active access to this patient')

  const code = generateOtpCode()
  const codeHash = await hashOtp(code)

  // Supersede any earlier pending code for this doctor+patient, then issue a fresh one.
  const token = await prisma.$transaction(async (tx) => {
    await tx.otpToken.updateMany({
      where: { patientId: patient.id, doctorId: doctor.id, isUsed: false },
      data: { isUsed: true },
    })
    return tx.otpToken.create({
      data: {
        patientId: patient.id,
        doctorId: doctor.id,
        codeHash,
        reason: input.reason ?? null,
        expiresAt: minutesFromNow(env.OTP_TTL_MINUTES),
      },
    })
  })

  const delivery = await sendOtpSms(patient.user.phone, code, 'access')

  await writeAudit({
    actorUserId: userId,
    action: 'create',
    patientId: patient.id,
    resource: `consent_request:${token.id}`,
    ipAddress: ipAddress ?? null,
  })

  return {
    requestId: token.id,
    patient: { uhid: patient.uhid, fullName: patient.fullName },
    reason: token.reason,
    expiresAt: token.expiresAt,
    otpMode: delivery.mode,
    smsSent: delivery.delivered,
    // Demo affordance only: lets the code be tested without a live SMS gateway.
    ...(env.OTP_MODE === 'demo' ? { devOtp: code } : {}),
  }
}

// ---------------------------------------------------------------- doctor: verify

export async function verifyAccess(
  userId: string,
  input: VerifyOtpInput,
  ipAddress?: string | null,
) {
  const doctor = await getDoctorOrThrow(userId)

  const token = await prisma.otpToken.findUnique({
    where: { id: input.requestId },
    include: { patient: { select: { id: true, uhid: true, fullName: true } } },
  })
  if (!token || token.doctorId !== doctor.id) {
    throw AppError.notFound('Access request not found')
  }
  if (token.isUsed) {
    throw AppError.badRequest('This code has already been used or the request was cancelled')
  }
  if (token.expiresAt.getTime() < Date.now()) {
    throw AppError.badRequest('This code has expired. Please request access again.')
  }
  if (token.attempts >= env.OTP_MAX_ATTEMPTS) {
    throw AppError.tooMany('Too many incorrect attempts. Please request a new code.')
  }

  const ok = await verifyOtp(input.code, token.codeHash)
  if (!ok) {
    await prisma.otpToken.update({
      where: { id: token.id },
      data: { attempts: { increment: 1 } },
    })
    const remaining = Math.max(0, env.OTP_MAX_ATTEMPTS - (token.attempts + 1))
    throw AppError.badRequest(`Invalid code. ${remaining} attempt(s) remaining.`)
  }

  // Success: consume the token and open a time-boxed session, atomically.
  const session = await prisma.$transaction(async (tx) => {
    const created = await tx.accessSession.create({
      data: {
        patientId: token.patientId,
        doctorId: doctor.id,
        status: 'active',
        expiresAt: minutesFromNow(env.SESSION_TTL_MINUTES),
      },
    })
    await tx.otpToken.update({
      where: { id: token.id },
      data: { isUsed: true, sessionId: created.id },
    })
    return created
  })

  await writeAudit({
    actorUserId: userId,
    action: 'grant',
    patientId: token.patientId,
    resource: `session:${session.id}`,
    ipAddress: ipAddress ?? null,
  })

  return {
    sessionId: session.id,
    patient: { uhid: token.patient.uhid, fullName: token.patient.fullName },
    grantedAt: session.grantedAt,
    expiresAt: session.expiresAt,
  }
}

// ---------------------------------------------------------------- doctor: list sessions

export async function listDoctorSessions(userId: string) {
  const doctor = await getDoctorOrThrow(userId)
  await expireStaleSessions()

  const sessions = await prisma.accessSession.findMany({
    where: { doctorId: doctor.id, status: 'active', expiresAt: { gt: new Date() } },
    include: { patient: { select: { uhid: true, fullName: true } } },
    orderBy: { grantedAt: 'desc' },
  })

  return sessions.map((s) => ({
    sessionId: s.id,
    patient: s.patient,
    grantedAt: s.grantedAt,
    expiresAt: s.expiresAt,
  }))
}

// ---------------------------------------------------------------- patient: view activity

export async function listPatientActivity(userId: string) {
  const patient = await getPatientOrThrow(userId)
  await expireStaleSessions()
  const now = new Date()

  const doctorSelect = { fullName: true, specialization: true, bmdcNumber: true } as const

  const [pending, active] = await Promise.all([
    prisma.otpToken.findMany({
      where: { patientId: patient.id, isUsed: false, expiresAt: { gt: now } },
      include: { doctor: { select: doctorSelect } },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.accessSession.findMany({
      where: { patientId: patient.id, status: 'active', expiresAt: { gt: now } },
      include: { doctor: { select: doctorSelect } },
      orderBy: { grantedAt: 'desc' },
    }),
  ])

  return {
    pendingRequests: pending.map((p) => ({
      requestId: p.id,
      doctor: p.doctor,
      reason: p.reason,
      requestedAt: p.createdAt,
      expiresAt: p.expiresAt,
    })),
    activeSessions: active.map((s) => ({
      sessionId: s.id,
      doctor: s.doctor,
      grantedAt: s.grantedAt,
      expiresAt: s.expiresAt,
    })),
  }
}

// ---------------------------------------------------------------- patient: deny / revoke

export async function denyRequest(userId: string, requestId: string, ipAddress?: string | null) {
  const patient = await getPatientOrThrow(userId)

  const token = await prisma.otpToken.findUnique({ where: { id: requestId } })
  if (!token || token.patientId !== patient.id) throw AppError.notFound('Request not found')
  if (token.isUsed) throw AppError.badRequest('This request is no longer pending')

  await prisma.otpToken.update({ where: { id: token.id }, data: { isUsed: true } })

  await writeAudit({
    actorUserId: userId,
    action: 'revoke',
    patientId: patient.id,
    resource: `consent_request:${token.id}`,
    ipAddress: ipAddress ?? null,
  })

  return { requestId: token.id, status: 'denied' as const }
}

export async function revokeSession(userId: string, sessionId: string, ipAddress?: string | null) {
  const patient = await getPatientOrThrow(userId)

  const session = await prisma.accessSession.findUnique({ where: { id: sessionId } })
  if (!session || session.patientId !== patient.id) throw AppError.notFound('Session not found')
  if (session.status !== 'active') throw AppError.badRequest('This session is not active')

  await prisma.accessSession.update({ where: { id: session.id }, data: { status: 'revoked' } })

  await writeAudit({
    actorUserId: userId,
    action: 'revoke',
    patientId: patient.id,
    resource: `session:${session.id}`,
    ipAddress: ipAddress ?? null,
  })

  return { sessionId: session.id, status: 'revoked' as const }
}

// ---------------------------------------------------------------- reusable guard

/**
 * Returns the live session if `doctorId` currently has consented access to
 * `patientId`, else null. Other modules (record read/write) gate on this.
 */
export async function getActiveAccessSession(doctorId: string, patientId: string) {
  await expireStaleSessions()
  return prisma.accessSession.findFirst({
    where: { doctorId, patientId, status: 'active', expiresAt: { gt: new Date() } },
  })
}
