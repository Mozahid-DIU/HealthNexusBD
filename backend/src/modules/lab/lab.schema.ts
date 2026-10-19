import { z } from 'zod'

const UHID_REGEX = /^BD-\d{4}-\d{5}$/

const PHONE_REGEX = /^01\d{9}$/

/** Find a patient by UHID or mobile number (FR-8); at least one is required. */
export const searchQuerySchema = z
  .object({
    uhid: z.string().trim().toUpperCase().regex(UHID_REGEX, 'Invalid UHID').optional(),
    phone: z.string().trim().regex(PHONE_REGEX, 'Invalid phone').optional(),
  })
  .refine((v) => Boolean(v.uhid) || Boolean(v.phone), {
    message: 'Provide a uhid or phone to search',
  })

/** Fields accompanying the uploaded PDF (arrive as multipart text fields). */
export const uploadReportSchema = z.object({
  uhid: z.string().trim().toUpperCase().regex(UHID_REGEX, 'Invalid UHID'),
  testName: z.string().trim().min(2, 'Test name is required').max(120),
})

export const listQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
})

export const idParamSchema = z.object({
  id: z.string().uuid('Invalid id'),
})

export type SearchQuery = z.infer<typeof searchQuerySchema>
export type UploadReportInput = z.infer<typeof uploadReportSchema>
export type ListQuery = z.infer<typeof listQuerySchema>
