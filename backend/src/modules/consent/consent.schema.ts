import { z } from 'zod'

/** UHID format issued by the app: BD-YYYY-XXXXX (e.g. BD-2026-01234). */
const UHID_REGEX = /^BD-\d{4}-\d{5}$/

export const requestAccessSchema = z.object({
  uhid: z
    .string()
    .trim()
    .toUpperCase()
    .regex(UHID_REGEX, 'Invalid UHID format (expected BD-YYYY-XXXXX)'),
  reason: z.string().trim().max(200).optional(),
})

export const verifyOtpSchema = z.object({
  requestId: z.string().uuid('Invalid request id'),
  code: z.string().regex(/^\d{6}$/, 'The code must be exactly 6 digits'),
})

/** Shared schema for :id route params that must be a UUID. */
export const idParamSchema = z.object({
  id: z.string().uuid('Invalid id'),
})

export type RequestAccessInput = z.infer<typeof requestAccessSchema>
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>
