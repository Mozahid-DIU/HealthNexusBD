import type { Request, Response } from 'express'
import { asyncHandler } from '../../utils/asyncHandler.ts'
import { sendSuccess } from '../../utils/apiResponse.ts'
import { AppError } from '../../utils/AppError.ts'
import * as consentService from './consent.service.ts'

/** Every consent route runs after `authenticate`, so req.user is present. */
function userId(req: Request): string {
  if (!req.user) throw AppError.unauthorized()
  return req.user.id
}

// --- doctor ---

export const requestAccessController = asyncHandler(async (req: Request, res: Response) => {
  const result = await consentService.requestAccess(userId(req), req.body, req.ip)
  return sendSuccess(res, result, 201)
})

export const verifyAccessController = asyncHandler(async (req: Request, res: Response) => {
  const result = await consentService.verifyAccess(userId(req), req.body, req.ip)
  return sendSuccess(res, result, 201)
})

export const doctorSessionsController = asyncHandler(async (req: Request, res: Response) => {
  const result = await consentService.listDoctorSessions(userId(req))
  return sendSuccess(res, result)
})

// --- patient ---

export const patientActivityController = asyncHandler(async (req: Request, res: Response) => {
  const result = await consentService.listPatientActivity(userId(req))
  return sendSuccess(res, result)
})

export const denyController = asyncHandler(async (req: Request, res: Response) => {
  const result = await consentService.denyRequest(userId(req), req.params.id, req.ip)
  return sendSuccess(res, result)
})

export const revokeController = asyncHandler(async (req: Request, res: Response) => {
  const result = await consentService.revokeSession(userId(req), req.params.id, req.ip)
  return sendSuccess(res, result)
})
