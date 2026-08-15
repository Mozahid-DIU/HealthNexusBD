import { Router } from 'express'
import { authenticate } from '../../middleware/auth.ts'
import { requireRole } from '../../middleware/rbac.ts'
import { validate } from '../../middleware/validate.ts'
import {
  auditQuerySchema,
  idParamSchema,
  listUsersQuerySchema,
  rejectSchema,
  suspendSchema,
  verificationQuerySchema,
} from './admin.schema.ts'
import {
  approveDoctorController,
  approveLabController,
  dashboardController,
  listAuditController,
  listDoctorsController,
  listLabsController,
  listUsersController,
  rejectDoctorController,
  rejectLabController,
  suspendUserController,
} from './admin.controller.ts'

export const adminRouter = Router()

// Every admin route requires an authenticated admin.
adminRouter.use(authenticate, requireRole('admin'))

adminRouter.get('/dashboard', dashboardController)

// Doctor verification
adminRouter.get('/doctors', validate(verificationQuerySchema, 'query'), listDoctorsController)
adminRouter.post('/doctors/:id/approve', validate(idParamSchema, 'params'), approveDoctorController)
adminRouter.post(
  '/doctors/:id/reject',
  validate(idParamSchema, 'params'),
  validate(rejectSchema),
  rejectDoctorController,
)

// Lab verification
adminRouter.get('/labs', validate(verificationQuerySchema, 'query'), listLabsController)
adminRouter.post('/labs/:id/approve', validate(idParamSchema, 'params'), approveLabController)
adminRouter.post(
  '/labs/:id/reject',
  validate(idParamSchema, 'params'),
  validate(rejectSchema),
  rejectLabController,
)

// Users
adminRouter.get('/users', validate(listUsersQuerySchema, 'query'), listUsersController)
adminRouter.post(
  '/users/:id/suspend',
  validate(idParamSchema, 'params'),
  validate(suspendSchema),
  suspendUserController,
)

// System-wide audit log
adminRouter.get('/audit', validate(auditQuerySchema, 'query'), listAuditController)
