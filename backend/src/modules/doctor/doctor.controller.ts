import type { Request, Response } from 'express'
import { asyncHandler } from '../../utils/asyncHandler.ts'
import { sendSuccess } from '../../utils/apiResponse.ts'
import { AppError } from '../../utils/AppError.ts'
import * as doctorService from './doctor.service.ts'
import type { ListQuery, SearchQuery } from './doctor.schema.ts'

function userId(req: Request): string {
  if (!req.user) throw AppError.unauthorized()
  return req.user.id
}

/** req.query is already validated/coerced by `validate(schema, 'query')`. */
function query<T>(req: Request): T {
  return req.query as unknown as T
}

export const searchController = asyncHandler(async (req: Request, res: Response) => {
  const result = await doctorService.searchPatient(userId(req), query<SearchQuery>(req))
  return sendSuccess(res, result)
})

export const myPatientsController = asyncHandler(async (req: Request, res: Response) => {
  return sendSuccess(res, await doctorService.listMyPatients(userId(req)))
})

export const patientRecordsController = asyncHandler(async (req: Request, res: Response) => {
  const { data, meta } = await doctorService.getPatientRecords(
    userId(req),
    req.params.id,
    query<ListQuery>(req),
    req.ip,
  )
  return sendSuccess(res, data, 200, meta)
})

export const createRecordController = asyncHandler(async (req: Request, res: Response) => {
  const result = await doctorService.createRecord(userId(req), req.body, req.ip)
  return sendSuccess(res, result, 201)
})

export const addPrescriptionController = asyncHandler(async (req: Request, res: Response) => {
  const result = await doctorService.addPrescription(userId(req), req.params.id, req.body, req.ip)
  return sendSuccess(res, result, 201)
})

export const aiSummaryController = asyncHandler(async (req: Request, res: Response) => {
  const result = await doctorService.addAiSummary(userId(req), req.params.id, req.ip)
  return sendSuccess(res, result, 201)
})
