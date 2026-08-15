import { z } from 'zod'

const passwordField = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(72, 'Password is too long')

const phoneField = z
  .string()
  .regex(/^01\d{9}$/, 'Phone must be a valid Bangladeshi number (e.g. 01700000000)')

const emailField = z.string().email('Invalid email address').toLowerCase()

/** Patient registration. */
export const registerPatientSchema = z.object({
  role: z.literal('patient'),
  fullName: z.string().min(2, 'Full name is required').max(120),
  email: emailField,
  phone: phoneField,
  password: passwordField,
  nid: z.string().regex(/^\d{10,17}$/, 'NID must be 10–17 digits'),
  dateOfBirth: z.coerce.date().optional(),
  gender: z.enum(['male', 'female', 'other']).optional(),
  bloodGroup: z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']).optional(),
})

/** Doctor registration. */
export const registerDoctorSchema = z.object({
  role: z.literal('doctor'),
  fullName: z.string().min(2, 'Full name is required').max(120),
  email: emailField,
  phone: phoneField,
  password: passwordField,
  bmdcNumber: z.string().min(3, 'BMDC registration number is required').max(40),
  specialization: z.string().min(2).max(80).optional(),
})

/** Lab registration. */
export const registerLabSchema = z.object({
  role: z.literal('lab'),
  centerName: z.string().min(2, 'Center name is required').max(160),
  email: emailField,
  phone: phoneField,
  password: passwordField,
  licenseNumber: z.string().min(3, 'DGHS license number is required').max(60),
  address: z.string().max(255).optional(),
})

/** Discriminated union — one endpoint, three role shapes. */
export const registerSchema = z.discriminatedUnion('role', [
  registerPatientSchema,
  registerDoctorSchema,
  registerLabSchema,
])

export const loginSchema = z.object({
  identifier: z.string().min(3, 'Enter your email or phone'), // email OR phone
  password: z.string().min(1, 'Password is required'),
})

export const refreshSchema = z.object({
  refreshToken: z.string().min(10, 'Refresh token is required'),
})

export const forgotPasswordSchema = z.object({
  email: emailField,
})

export const resetPasswordSchema = z.object({
  email: emailField,
  code: z.string().regex(/^\d{6}$/, 'The code must be exactly 6 digits'),
  newPassword: passwordField,
})

export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type RefreshInput = z.infer<typeof refreshSchema>
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>
