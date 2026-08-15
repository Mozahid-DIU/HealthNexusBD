import type { Prisma } from '@prisma/client'
import { prisma } from '../../config/prisma.ts'
import { AppError } from '../../utils/AppError.ts'
import { getPagination } from '../../utils/pagination.ts'
import { writeAudit } from '../../utils/audit.ts'
import type {
  AuditQuery,
  ListUsersQuery,
  VerificationQuery,
} from './admin.schema.ts'

// ---------------------------------------------------------------- dashboard

export async function getDashboard() {
  const now = new Date()
  const [
    patients,
    doctors,
    labs,
    pendingDoctors,
    pendingLabs,
    suspended,
    activeSessions,
    records,
    labReports,
  ] = await Promise.all([
    prisma.user.count({ where: { role: 'patient' } }),
    prisma.user.count({ where: { role: 'doctor' } }),
    prisma.user.count({ where: { role: 'lab' } }),
    prisma.user.count({ where: { role: 'doctor', status: 'pending' } }),
    prisma.user.count({ where: { role: 'lab', status: 'pending' } }),
    prisma.user.count({ where: { status: 'suspended' } }),
    prisma.accessSession.count({ where: { status: 'active', expiresAt: { gt: now } } }),
    prisma.medicalRecord.count(),
    prisma.labReport.count(),
  ])

  return {
    users: { patients, doctors, labs, total: patients + doctors + labs },
    pending: { doctors: pendingDoctors, labs: pendingLabs },
    suspended,
    activeSessions,
    clinical: { records, labReports },
  }
}

// ---------------------------------------------------------------- doctor verification

const doctorUserSelect = {
  select: { id: true, email: true, phone: true, status: true, createdAt: true },
} as const

export async function listDoctors(query: VerificationQuery) {
  const { skip, take, page, limit } = getPagination(query)
  const where: Prisma.DoctorWhereInput = query.status ? { user: { status: query.status } } : {}

  const [total, rows] = await Promise.all([
    prisma.doctor.count({ where }),
    prisma.doctor.findMany({
      where,
      skip,
      take,
      orderBy: { user: { createdAt: 'desc' } },
      include: { user: doctorUserSelect },
    }),
  ])

  const data = rows.map((d) => ({
    id: d.id,
    fullName: d.fullName,
    bmdcNumber: d.bmdcNumber,
    specialization: d.specialization,
    isBmdcVerified: d.isBmdcVerified,
    approvedAt: d.approvedAt,
    account: d.user,
  }))

  return { data, meta: { total, page, limit } }
}

export async function approveDoctor(adminUserId: string, doctorId: string, ip?: string | null) {
  const doctor = await prisma.doctor.findUnique({ where: { id: doctorId }, include: { user: true } })
  if (!doctor) throw AppError.notFound('Doctor not found')
  if (doctor.isBmdcVerified && doctor.user.status === 'active') {
    throw AppError.conflict('This doctor is already approved')
  }

  await prisma.$transaction([
    prisma.doctor.update({
      where: { id: doctorId },
      data: { isBmdcVerified: true, approvedAt: new Date() },
    }),
    prisma.user.update({ where: { id: doctor.userId }, data: { status: 'active' } }),
  ])

  await writeAudit({
    actorUserId: adminUserId,
    action: 'update',
    resource: `doctor_approved:${doctorId}`,
    ipAddress: ip ?? null,
  })

  return { id: doctorId, status: 'approved' as const }
}

export async function rejectDoctor(
  adminUserId: string,
  doctorId: string,
  reason: string,
  ip?: string | null,
) {
  const doctor = await prisma.doctor.findUnique({ where: { id: doctorId }, include: { user: true } })
  if (!doctor) throw AppError.notFound('Doctor not found')
  if (doctor.user.status === 'suspended') throw AppError.conflict('This doctor is already rejected')

  await prisma.user.update({ where: { id: doctor.userId }, data: { status: 'suspended' } })

  await writeAudit({
    actorUserId: adminUserId,
    action: 'update',
    resource: `doctor_rejected:${doctorId} (${reason})`,
    ipAddress: ip ?? null,
  })

  return { id: doctorId, status: 'rejected' as const, reason }
}

// ---------------------------------------------------------------- lab verification

const labUserSelect = {
  select: { id: true, email: true, phone: true, status: true, createdAt: true },
} as const

export async function listLabs(query: VerificationQuery) {
  const { skip, take, page, limit } = getPagination(query)
  const where: Prisma.DiagnosticLabWhereInput = query.status
    ? { user: { status: query.status } }
    : {}

  const [total, rows] = await Promise.all([
    prisma.diagnosticLab.count({ where }),
    prisma.diagnosticLab.findMany({
      where,
      skip,
      take,
      orderBy: { user: { createdAt: 'desc' } },
      include: { user: labUserSelect },
    }),
  ])

  const data = rows.map((l) => ({
    id: l.id,
    centerName: l.centerName,
    licenseNumber: l.licenseNumber,
    address: l.address,
    isApproved: l.isApproved,
    account: l.user,
  }))

  return { data, meta: { total, page, limit } }
}

export async function approveLab(adminUserId: string, labId: string, ip?: string | null) {
  const lab = await prisma.diagnosticLab.findUnique({ where: { id: labId }, include: { user: true } })
  if (!lab) throw AppError.notFound('Lab not found')
  if (lab.isApproved && lab.user.status === 'active') {
    throw AppError.conflict('This lab is already approved')
  }

  await prisma.$transaction([
    prisma.diagnosticLab.update({ where: { id: labId }, data: { isApproved: true } }),
    prisma.user.update({ where: { id: lab.userId }, data: { status: 'active' } }),
  ])

  await writeAudit({
    actorUserId: adminUserId,
    action: 'update',
    resource: `lab_approved:${labId}`,
    ipAddress: ip ?? null,
  })

  return { id: labId, status: 'approved' as const }
}

export async function rejectLab(
  adminUserId: string,
  labId: string,
  reason: string,
  ip?: string | null,
) {
  const lab = await prisma.diagnosticLab.findUnique({ where: { id: labId }, include: { user: true } })
  if (!lab) throw AppError.notFound('Lab not found')
  if (lab.user.status === 'suspended') throw AppError.conflict('This lab is already rejected')

  await prisma.user.update({ where: { id: lab.userId }, data: { status: 'suspended' } })

  await writeAudit({
    actorUserId: adminUserId,
    action: 'update',
    resource: `lab_rejected:${labId} (${reason})`,
    ipAddress: ip ?? null,
  })

  return { id: labId, status: 'rejected' as const, reason }
}

// ---------------------------------------------------------------- users

export async function listUsers(query: ListUsersQuery) {
  const { skip, take, page, limit } = getPagination(query)
  const where: Prisma.UserWhereInput = {
    ...(query.role ? { role: query.role } : {}),
    ...(query.status ? { status: query.status } : {}),
  }

  const [total, rows] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        createdAt: true,
        patient: { select: { fullName: true, uhid: true } },
        doctor: { select: { fullName: true, bmdcNumber: true } },
        lab: { select: { centerName: true, licenseNumber: true } },
        admin: { select: { fullName: true, adminLevel: true } },
      },
    }),
  ])

  return { data: rows, meta: { total, page, limit } }
}

export async function setUserSuspension(
  adminUserId: string,
  userId: string,
  suspend: boolean,
  ip?: string | null,
) {
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) throw AppError.notFound('User not found')
  if (user.role === 'admin') throw AppError.forbidden('Admin accounts cannot be suspended')

  const nextStatus = suspend ? 'suspended' : 'active'
  if (user.status === nextStatus) {
    throw AppError.conflict(`User is already ${nextStatus}`)
  }

  await prisma.user.update({ where: { id: userId }, data: { status: nextStatus } })

  await writeAudit({
    actorUserId: adminUserId,
    action: 'update',
    resource: `user_${suspend ? 'suspended' : 'reactivated'}:${userId}`,
    ipAddress: ip ?? null,
  })

  return { id: userId, status: nextStatus }
}

// ---------------------------------------------------------------- audit log

export async function listAudit(query: AuditQuery) {
  const { skip, take, page, limit } = getPagination(query)
  const where: Prisma.AuditLogWhereInput = query.action ? { action: query.action } : {}

  const [total, rows] = await Promise.all([
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        action: true,
        resource: true,
        ipAddress: true,
        createdAt: true,
        actor: { select: { email: true, role: true } },
        patient: { select: { uhid: true, fullName: true } },
      },
    }),
  ])

  return { data: rows, meta: { total, page, limit } }
}
