import type { Request, Response } from 'express'
import { asyncHandler } from '../../utils/asyncHandler.ts'
import { sendSuccess } from '../../utils/apiResponse.ts'
import { AppError } from '../../utils/AppError.ts'
import * as adminService from './admin.service.ts'
import type { AuditQuery, ListUsersQuery, VerificationQuery } from './admin.schema.ts'

function adminId(req: Request): string {
  if (!req.user) throw AppError.unauthorized()
  return req.user.id
}

/**
 * `validate(schema, 'query')` has already parsed + coerced req.query into the
 * schema shape at runtime; this re-casts it so the service sees the right type.
 */
function query<T>(req: Request): T {
  return req.query as unknown as T
}

export const dashboardController = asyncHandler(async (_req: Request, res: Response) => {
  return sendSuccess(res, await adminService.getDashboard())
})

// --- doctors ---

export const listDoctorsController = asyncHandler(async (req: Request, res: Response) => {
  const { data, meta } = await adminService.listDoctors(query<VerificationQuery>(req))
  return sendSuccess(res, data, 200, meta)
})

export const approveDoctorController = asyncHandler(async (req: Request, res: Response) => {
  return sendSuccess(res, await adminService.approveDoctor(adminId(req), req.params.id, req.ip))
})

export const rejectDoctorController = asyncHandler(async (req: Request, res: Response) => {
  return sendSuccess(res, await adminService.rejectDoctor(adminId(req), req.params.id, req.body.reason, req.ip))
})

// --- labs ---

export const listLabsController = asyncHandler(async (req: Request, res: Response) => {
  const { data, meta } = await adminService.listLabs(query<VerificationQuery>(req))
  return sendSuccess(res, data, 200, meta)
})

export const approveLabController = asyncHandler(async (req: Request, res: Response) => {
  return sendSuccess(res, await adminService.approveLab(adminId(req), req.params.id, req.ip))
})

export const rejectLabController = asyncHandler(async (req: Request, res: Response) => {
  return sendSuccess(res, await adminService.rejectLab(adminId(req), req.params.id, req.body.reason, req.ip))
})

// --- users ---

export const listUsersController = asyncHandler(async (req: Request, res: Response) => {
  const { data, meta } = await adminService.listUsers(query<ListUsersQuery>(req))
  return sendSuccess(res, data, 200, meta)
})

export const suspendUserController = asyncHandler(async (req: Request, res: Response) => {
  const result = await adminService.setUserSuspension(adminId(req), req.params.id, req.body.suspend, req.ip)
  return sendSuccess(res, result)
})

// --- audit ---

export const listAuditController = asyncHandler(async (req: Request, res: Response) => {
  const { data, meta } = await adminService.listAudit(query<AuditQuery>(req))
  return sendSuccess(res, data, 200, meta)
})
