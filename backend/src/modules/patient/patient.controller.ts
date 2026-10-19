import type { Request, Response } from 'express'
import { asyncHandler } from '../../utils/asyncHandler.ts'
import { sendPdf, sendSuccess } from '../../utils/apiResponse.ts'
import { AppError } from '../../utils/AppError.ts'
import * as patientService from './patient.service.ts'
import type { ListQuery } from './patient.schema.ts'

function userId(req: Request): string {
  if (!req.user) throw AppError.unauthorized()
  return req.user.id
}

/** req.query is already validated/coerced by `validate(schema, 'query')`. */
function query(req: Request): ListQuery {
  return req.query as unknown as ListQuery
}

export const getProfileController = asyncHandler(async (req: Request, res: Response) => {
  return sendSuccess(res, await patientService.getProfile(userId(req)))
})

export const updateProfileController = asyncHandler(async (req: Request, res: Response) => {
  return sendSuccess(res, await patientService.updateProfile(userId(req), req.body))
})

export const getRecordsController = asyncHandler(async (req: Request, res: Response) => {
  const { data, meta } = await patientService.getRecords(userId(req), query(req))
  return sendSuccess(res, data, 200, meta)
})

export const getRecordByIdController = asyncHandler(async (req: Request, res: Response) => {
  return sendSuccess(res, await patientService.getRecordById(userId(req), req.params.id))
})

export const getLabReportsController = asyncHandler(async (req: Request, res: Response) => {
  const { data, meta } = await patientService.getLabReports(userId(req), query(req))
  return sendSuccess(res, data, 200, meta)
})

export const getAuditController = asyncHandler(async (req: Request, res: Response) => {
  const { data, meta } = await patientService.getAudit(userId(req), query(req))
  return sendSuccess(res, data, 200, meta)
})

export const getLabReportFileController = asyncHandler(async (req: Request, res: Response) => {
  const { pdf, filename } = await patientService.getLabReportFile(userId(req), req.params.id)
  return sendPdf(res, pdf, filename)
})

export const getNotificationsController = asyncHandler(async (req: Request, res: Response) => {
  const { data, meta } = await patientService.getNotifications(userId(req), query(req))
  return sendSuccess(res, data, 200, meta)
})

export const markNotificationReadController = asyncHandler(async (req: Request, res: Response) => {
  return sendSuccess(res, await patientService.markNotificationRead(userId(req), req.params.id))
})

export const markAllNotificationsReadController = asyncHandler(async (req: Request, res: Response) => {
  return sendSuccess(res, await patientService.markAllNotificationsRead(userId(req)))
})
