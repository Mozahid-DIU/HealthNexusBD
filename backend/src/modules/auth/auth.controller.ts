import type { Request, Response } from 'express'
import { sendSuccess } from '../../utils/apiResponse.ts'
import { asyncHandler } from '../../utils/asyncHandler.ts'
import * as authService from './auth.service.ts'
import { AppError } from '../../utils/AppError.ts'

export const registerController = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.register(req.body)
  return sendSuccess(res, result, 201)
})

export const loginController = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.login(req.body, req.ip)
  return sendSuccess(res, result)
})

export const refreshController = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.refresh(req.body.refreshToken)
  return sendSuccess(res, result)
})

export const meController = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw AppError.unauthorized()
  const profile = await authService.getProfile(req.user.id)
  return sendSuccess(res, profile)
})

export const logoutController = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw AppError.unauthorized()
  return sendSuccess(res, await authService.logout(req.user.id))
})

export const forgotPasswordController = asyncHandler(async (req: Request, res: Response) => {
  return sendSuccess(res, await authService.forgotPassword(req.body.email))
})

export const resetPasswordController = asyncHandler(async (req: Request, res: Response) => {
  return sendSuccess(res, await authService.resetPassword(req.body))
})
