import type { AuditAction } from '@prisma/client'
import { prisma } from '../config/prisma.ts'
import { logger } from './logger.ts'

interface AuditInput {
  actorUserId: string
  action: AuditAction
  patientId?: string | null
  resource?: string | null
  ipAddress?: string | null
}

/**
 * Like writeAudit, but skips the entry if the same actor already logged the same
 * action on the same resource within `windowMs` (e.g. a search repeated on refocus),
 * so the patient's access log stays readable.
 */
export async function writeAuditOnce(input: AuditInput & { resource: string }, windowMs: number): Promise<void> {
  const recent = await prisma.auditLog.findFirst({
    where: {
      patientId: input.patientId ?? null,
      actorUserId: input.actorUserId,
      action: input.action,
      resource: input.resource,
      createdAt: { gte: new Date(Date.now() - windowMs) },
    },
    select: { id: true },
  })
  if (!recent) await writeAudit(input)
}

/**
 * Append-only audit writer. Never throws into the caller — an audit failure must not
 * break the user action, but is logged server-side.
 */
export async function writeAudit(input: AuditInput): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        actorUserId: input.actorUserId,
        action: input.action,
        patientId: input.patientId ?? null,
        resource: input.resource ?? null,
        ipAddress: input.ipAddress ?? null,
      },
    })
  } catch (err) {
    logger.error({ err }, 'Failed to write audit log')
  }
}

/** A repeated look-up within this window (refocus, a second click) is logged once. */
const SEARCH_AUDIT_WINDOW_MS = 10 * 60_000

/** A doctor or lab found this patient by UHID or phone: the patient can see who looked. */
export function auditPatientSearch(actorUserId: string, patientId: string, ip?: string | null): Promise<void> {
  return writeAuditOnce(
    { actorUserId, action: 'view', patientId, resource: `patient_search:${patientId}`, ipAddress: ip ?? null },
    SEARCH_AUDIT_WINDOW_MS,
  )
}
