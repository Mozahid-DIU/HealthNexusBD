import { Router } from 'express'
import { authenticate } from '../../middleware/auth.ts'
import { requireRole } from '../../middleware/rbac.ts'
import { authLimiter } from '../../middleware/rateLimit.ts'
import { validate } from '../../middleware/validate.ts'
import { idParamSchema, requestAccessSchema, verifyOtpSchema } from './consent.schema.ts'
import {
  denyController,
  doctorSessionsController,
  patientActivityController,
  requestAccessController,
  revokeController,
  verifyAccessController,
} from './consent.controller.ts'

export const consentRouter = Router()

// --- Doctor: request access, verify OTP, list own active sessions ---
consentRouter.post(
  '/request',
  authenticate,
  requireRole('doctor'),
  authLimiter,
  validate(requestAccessSchema),
  requestAccessController,
)
consentRouter.post(
  '/verify',
  authenticate,
  requireRole('doctor'),
  authLimiter,
  validate(verifyOtpSchema),
  verifyAccessController,
)
consentRouter.get('/sessions', authenticate, requireRole('doctor'), doctorSessionsController)

// --- Patient: view requests/sessions, deny a request, revoke a session ---
consentRouter.get('/requests', authenticate, requireRole('patient'), patientActivityController)
consentRouter.post(
  '/requests/:id/deny',
  authenticate,
  requireRole('patient'),
  validate(idParamSchema, 'params'),
  denyController,
)
consentRouter.post(
  '/sessions/:id/revoke',
  authenticate,
  requireRole('patient'),
  validate(idParamSchema, 'params'),
  revokeController,
)
