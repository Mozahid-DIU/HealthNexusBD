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

export const listUsersQuerySchema = z.object({
  ...pageFields,
  role: z.enum(['patient', 'doctor', 'lab', 'admin']).optional(),
  status: z.enum(['active', 'pending', 'suspended']).optional(),
})

export const auditQuerySchema = z.object({
  ...pageFields,
  action: z.enum(['view', 'create', 'update', 'grant', 'revoke', 'login']).optional(),
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
export type RejectInput = z.infer<typeof rejectSchema>
export type SuspendInput = z.infer<typeof suspendSchema>
