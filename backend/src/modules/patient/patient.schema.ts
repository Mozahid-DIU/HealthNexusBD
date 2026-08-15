import { z } from 'zod'

export const updateProfileSchema = z
  .object({
    fullName: z.string().trim().min(2).max(120).optional(),
    dateOfBirth: z.coerce.date().optional(),
    gender: z.enum(['male', 'female', 'other']).optional(),
    bloodGroup: z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']).optional(),
    allergies: z.array(z.string().trim().min(1).max(60)).max(50).optional(),
    chronicDiseases: z.array(z.string().trim().min(1).max(60)).max(50).optional(),
  })
  .refine((v) => Object.keys(v).length > 0, {
    message: 'Provide at least one field to update',
  })

export const listQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
})

export const idParamSchema = z.object({
  id: z.string().uuid('Invalid id'),
})

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>
export type ListQuery = z.infer<typeof listQuerySchema>
