import { z } from 'zod'

const UHID_REGEX = /^BD-\d{4}-\d{5}$/
const PHONE_REGEX = /^01\d{9}$/

/** Search for a patient by UHID or phone (at least one required). */
export const searchQuerySchema = z
  .object({
    uhid: z.string().trim().toUpperCase().regex(UHID_REGEX, 'Invalid UHID').optional(),
    phone: z.string().trim().regex(PHONE_REGEX, 'Invalid phone').optional(),
  })
  .refine((v) => Boolean(v.uhid) || Boolean(v.phone), {
    message: 'Provide a uhid or phone to search',
  })

export const listQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
})

const medicationSchema = z.object({
  name: z.string().trim().min(1).max(120),
  dose: z.string().trim().min(1).max(60),
  frequency: z.string().trim().min(1).max(60),
  duration: z.string().trim().max(60).optional(),
})

export const createRecordSchema = z.object({
  patientId: z.string().uuid('Invalid patient id'),
  diagnosis: z.string().trim().min(2, 'Diagnosis is required').max(200),
  content: z.string().trim().min(2, 'Clinical note is required').max(5000),
  symptoms: z.array(z.string().trim().min(1).max(100)).max(30).optional(),
  followUpDate: z.coerce.date().optional(),
})

export const prescriptionSchema = z.object({
  medications: z.array(medicationSchema).min(1, 'At least one medication is required'),
  recommendedTests: z.array(z.string().trim().min(1).max(120)).max(30).optional(),
  notes: z.string().trim().max(500).optional(),
})

export const idParamSchema = z.object({
  id: z.string().uuid('Invalid id'),
})

export type SearchQuery = z.infer<typeof searchQuerySchema>
export type ListQuery = z.infer<typeof listQuerySchema>
export type CreateRecordInput = z.infer<typeof createRecordSchema>
export type PrescriptionInput = z.infer<typeof prescriptionSchema>
