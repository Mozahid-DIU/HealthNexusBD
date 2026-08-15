import { Router } from 'express'
import { authenticate } from '../../middleware/auth.ts'
import { requireRole } from '../../middleware/rbac.ts'
import { validate } from '../../middleware/validate.ts'
import { uploadPdf } from '../../middleware/upload.ts'
import { listQuerySchema, searchQuerySchema, uploadReportSchema } from './lab.schema.ts'
import {
  listUploadsController,
  searchController,
  uploadReportController,
} from './lab.controller.ts'

export const labRouter = Router()

// Every route requires an authenticated lab (approval is checked in the service).
labRouter.use(authenticate, requireRole('lab'))

labRouter.get('/search', validate(searchQuerySchema, 'query'), searchController)

// multer parses the multipart body first, then Zod validates the text fields.
labRouter.post('/reports', uploadPdf, validate(uploadReportSchema), uploadReportController)

labRouter.get('/uploads', validate(listQuerySchema, 'query'), listUploadsController)
