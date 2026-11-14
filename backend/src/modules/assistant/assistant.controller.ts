import type { Request, Response } from 'express'
import { asyncHandler } from '../../utils/asyncHandler.ts'
import { sendSuccess } from '../../utils/apiResponse.ts'
import { AppError } from '../../utils/AppError.ts'
import { chat } from './assistant.service.ts'

export const chatController = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw AppError.unauthorized()
  return sendSuccess(res, await chat(req.user.id, req.body, req.ip))
})
