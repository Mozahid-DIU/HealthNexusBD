import { z } from 'zod'

const pageFields = {
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
}

/** Verification queues: filter by the user's account status. */
export const verificationQuerySchema = z.object({
  ...pageFields,
  status: z.enum(['active', 'pending', 'suspended']).optional(),
})

/** Free-text search: trimmed, at least one character, bounded. */
const searchField = { q: z.string().trim().min(1).max(100).optional() }

export const listUsersQuerySchema = z.object({
  ...pageFields,
  ...searchField,
  role: z.enum(['patient', 'doctor', 'lab', 'admin']).optional(),
  status: z.enum(['active', 'pending', 'suspended']).optional(),
})

const auditAction = z.enum(['view', 'create', 'update', 'grant', 'revoke', 'login'])

export const auditQuerySchema = z.object({
  ...pageFields,
  ...searchField,
  action: auditAction.optional(),
  /** Leave one kind out, e.g. sign-ins in the dashboard's activity feed. */
  exclude: auditAction.optional(),
})

/** Chart window: the dashboard offers exactly these ranges. */
export const trendsQuerySchema = z.object({
  days: z.enum(['7', '30', '90']).default('30').transform(Number),
})

export const rejectSchema = z.object({
  reason: z.string().trim().min(3, 'Please provide a reason').max(200),
})

export const suspendSchema = z.object({
  suspend: z.boolean(),
})

export const idParamSchema = z.object({
  id: z.string().uuid('Invalid id'),
})

export type VerificationQuery = z.infer<typeof verificationQuerySchema>
export type ListUsersQuery = z.infer<typeof listUsersQuerySchema>
export type AuditQuery = z.infer<typeof auditQuerySchema>
export type TrendsQuery = z.infer<typeof trendsQuerySchema>
export type RejectInput = z.infer<typeof rejectSchema>
export type SuspendInput = z.infer<typeof suspendSchema>
