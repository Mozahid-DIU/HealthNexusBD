import { Router } from 'express'
import { authenticate } from '../../middleware/auth.ts'
import { requireRole } from '../../middleware/rbac.ts'
import { validate } from '../../middleware/validate.ts'
import {
  createRecordSchema,
  idParamSchema,
  listQuerySchema,
  patientReportParamsSchema,
  prescriptionSchema,
  searchQuerySchema,
} from './doctor.schema.ts'
import {
  addPrescriptionController,
  aiSummaryController,
  createRecordController,
  myPatientsController,
  patientLabReportFileController,
  patientLabReportsController,
  patientRecordsController,
  searchController,
} from './doctor.controller.ts'

export const doctorRouter = Router()

// Every route requires an authenticated doctor (verification is checked in the service).
doctorRouter.use(authenticate, requireRole('doctor'))

doctorRouter.get('/search', validate(searchQuerySchema, 'query'), searchController)
doctorRouter.get('/patients', myPatientsController)
doctorRouter.get(
  '/patients/:id/records',
  validate(idParamSchema, 'params'),
  validate(listQuerySchema, 'query'),
  patientRecordsController,
)
// Lab reports of a consented patient (list + decrypted PDF), both audited.
doctorRouter.get(
  '/patients/:id/lab-reports',
  validate(idParamSchema, 'params'),
  validate(listQuerySchema, 'query'),
  patientLabReportsController,
)
doctorRouter.get(
  '/patients/:id/lab-reports/:reportId/file',
  validate(patientReportParamsSchema, 'params'),
  patientLabReportFileController,
)
doctorRouter.post('/records', validate(createRecordSchema), createRecordController)
doctorRouter.post(
  '/records/:id/prescription',
  validate(idParamSchema, 'params'),
  validate(prescriptionSchema),
  addPrescriptionController,
)
doctorRouter.post(
  '/records/:id/ai-summary',
  validate(idParamSchema, 'params'),
  aiSummaryController,
)
