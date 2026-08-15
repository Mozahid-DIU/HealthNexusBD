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
