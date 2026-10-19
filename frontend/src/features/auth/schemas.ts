import { z } from 'zod'
import type { TranslationKey } from '@/i18n'

/**
 * These mirror the backend Zod schemas so the client fails fast with the same rules.
 * Every message is a translation key (checked by `msg`), so errors follow the language
 * toggle and a typo in a key is a compile error rather than raw text on screen.
 */
const msg = (key: TranslationKey) => ({ message: key })

const TOO_LONG = msg('validation.tooLong')

const email = z.string().trim().email(msg('validation.email'))
const phone = z.string().trim().regex(/^01\d{9}$/, msg('validation.phone'))
// bcrypt only uses the first 72 bytes; the backend rejects longer passwords.
const password = z.string().min(8, msg('validation.passwordMin')).max(72, TOO_LONG)
const fullName = z.string().trim().min(2, msg('validation.required')).max(120, TOO_LONG)
const optional = (s: z.ZodString) => s.optional().or(z.literal(''))

export const loginSchema = z.object({
  identifier: z.string().trim().min(3, msg('validation.identifier')),
  password: z.string().min(1, msg('validation.passwordRequired')),
})
export type LoginValues = z.infer<typeof loginSchema>

export const patientSchema = z.object({
  fullName,
  nid: z.string().trim().regex(/^\d{10,17}$/, msg('validation.nid')),
  email,
  phone,
  password,
})

export const doctorSchema = z.object({
  fullName,
  bmdcNumber: z.string().trim().min(3, msg('validation.required')).max(40, TOO_LONG),
  specialization: optional(z.string().trim().max(80, TOO_LONG)),
  email,
  phone,
  password,
})

export const labSchema = z.object({
  centerName: z.string().trim().min(2, msg('validation.required')).max(160, TOO_LONG),
  licenseNumber: z.string().trim().min(3, msg('validation.required')).max(60, TOO_LONG),
  address: optional(z.string().trim().max(255, TOO_LONG)),
  email,
  phone,
  password,
})

export const forgotSchema = z.object({ email })
export type ForgotValues = z.infer<typeof forgotSchema>

export const resetSchema = z.object({
  code: z.string().trim().regex(/^\d{6}$/, msg('validation.code6')),
  newPassword: password,
})
export type ResetValues = z.infer<typeof resetSchema>
