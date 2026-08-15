import type { Request, Response } from 'express'
import { asyncHandler } from '../../utils/asyncHandler.ts'
import { sendSuccess } from '../../utils/apiResponse.ts'
import { AppError } from '../../utils/AppError.ts'
import * as labService from './lab.service.ts'
import type { ListQuery, SearchQuery } from './lab.schema.ts'

function userId(req: Request): string {
  if (!req.user) throw AppError.unauthorized()
  return req.user.id
}

function query<T>(req: Request): T {
  return req.query as unknown as T
}

export const searchController = asyncHandler(async (req: Request, res: Response) => {
  const { uhid } = query<SearchQuery>(req)
  return sendSuccess(res, await labService.searchPatient(userId(req), uhid))
})

export const uploadReportController = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) throw AppError.badRequest('A PDF file is required (field name: "file")')
  const result = await labService.uploadReport(userId(req), req.body, req.file.buffer, req.ip)
  return sendSuccess(res, result, 201)
})

export const listUploadsController = asyncHandler(async (req: Request, res: Response) => {
  const { data, meta } = await labService.listUploads(userId(req), query<ListQuery>(req))
  return sendSuccess(res, data, 200, meta)
})
