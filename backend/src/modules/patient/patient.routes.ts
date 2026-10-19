import { Router } from 'express'
import { authenticate } from '../../middleware/auth.ts'
import { requireRole } from '../../middleware/rbac.ts'
import { validate } from '../../middleware/validate.ts'
import { idParamSchema, listQuerySchema, updateProfileSchema } from './patient.schema.ts'
import {
  getAuditController,
  getLabReportFileController,
  getNotificationsController,
  markAllNotificationsReadController,
  markNotificationReadController,
  getLabReportsController,
  getProfileController,
  getRecordByIdController,
  getRecordsController,
  updateProfileController,
} from './patient.controller.ts'

export const patientRouter = Router()

// Every route requires an authenticated patient acting on their own data.
patientRouter.use(authenticate, requireRole('patient'))

patientRouter.get('/profile', getProfileController)
patientRouter.patch('/profile', validate(updateProfileSchema), updateProfileController)

patientRouter.get('/records', validate(listQuerySchema, 'query'), getRecordsController)
patientRouter.get('/records/:id', validate(idParamSchema, 'params'), getRecordByIdController)

patientRouter.get('/lab-reports', validate(listQuerySchema, 'query'), getLabReportsController)
patientRouter.get(
  '/lab-reports/:id/file',
  validate(idParamSchema, 'params'),
  getLabReportFileController,
  getNotificationsController,
  markAllNotificationsReadController,
  markNotificationReadController,
)
patientRouter.get('/audit', validate(listQuerySchema, 'query'), getAuditController)

// FR-21 inbox: new lab reports and follow-up reminders.
patientRouter.get('/notifications', validate(listQuerySchema, 'query'), getNotificationsController)
patientRouter.post('/notifications/read-all', markAllNotificationsReadController)
patientRouter.post(
  '/notifications/:id/read',
  validate(idParamSchema, 'params'),
  markNotificationReadController,
)
