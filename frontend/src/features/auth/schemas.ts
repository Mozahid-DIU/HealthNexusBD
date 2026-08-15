import { z } from 'zod'

/** These mirror the backend Zod schemas so the client fails fast with the same rules. */

const email = z.string().trim().email('Enter a valid email')
const phone = z.string().trim().regex(/^01\d{9}$/, 'Enter a valid BD number (e.g. 017XXXXXXXX)')
const password = z.string().min(8, 'At least 8 characters')
const fullName = z.string().trim().min(2, 'Required').max(120)
const optional = (s: z.ZodString) => s.optional().or(z.literal(''))

export const loginSchema = z.object({
  identifier: z.string().trim().min(3, 'Enter your email or phone'),
  password: z.string().min(1, 'Enter your password'),
})
export type LoginValues = z.infer<typeof loginSchema>

export const patientSchema = z.object({
  fullName,
  nid: z.string().trim().regex(/^\d{10,17}$/, 'NID must be 10–17 digits'),
  email,
  phone,
  password,
})

export const doctorSchema = z.object({
  fullName,
  bmdcNumber: z.string().trim().min(3, 'Required').max(40),
  specialization: optional(z.string().trim().max(80)),
  email,
  phone,
  password,
})

export const labSchema = z.object({
  centerName: z.string().trim().min(2, 'Required').max(160),
  licenseNumber: z.string().trim().min(3, 'Required').max(60),
  address: optional(z.string().trim().max(255)),
  email,
  phone,
  password,
})

export const forgotSchema = z.object({ email })
export type ForgotValues = z.infer<typeof forgotSchema>

export const resetSchema = z.object({
  code: z.string().trim().regex(/^\d{6}$/, 'Enter the 6-digit code'),
  newPassword: password,
})
export type ResetValues = z.infer<typeof resetSchema>
