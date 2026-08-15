import type { NextFunction, Request, Response } from 'express'
import { ZodError } from 'zod'
import { MulterError } from 'multer'
import { Prisma } from '@prisma/client'
import { AppError } from '../utils/AppError.ts'
import { sendError } from '../utils/apiResponse.ts'
import { logger } from '../utils/logger.ts'
import { isDev } from '../config/env.ts'

/** 404 handler for unmatched routes. */
export function notFoundHandler(req: Request, res: Response): Response {
  return sendError(res, `Route not found: ${req.method} ${req.originalUrl}`, 404)
}

/** Global error handler — maps any thrown error to a safe JSON response. */
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  // next is required for Express to recognise this as an error handler
  _next: NextFunction,
): Response {
  // Known operational errors
  if (err instanceof AppError) {
    return sendError(res, err.message, err.statusCode)
  }

  // Validation errors
  if (err instanceof ZodError) {
    const msg = err.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ')
    return sendError(res, msg || 'Validation failed', 400)
  }

  // File upload errors (multer)
  if (err instanceof MulterError) {
    const message =
      err.code === 'LIMIT_FILE_SIZE'
        ? 'File is too large'
        : err.code === 'LIMIT_FILE_COUNT' || err.code === 'LIMIT_UNEXPECTED_FILE'
          ? 'Only a single file may be uploaded'
          : 'File upload failed'
    return sendError(res, message, 400)
  }

  // Prisma known errors (e.g. unique constraint)
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      const field = (err.meta?.target as string[] | undefined)?.join(', ') ?? 'field'
      return sendError(res, `A record with this ${field} already exists`, 409)
    }
    if (err.code === 'P2025') {
      return sendError(res, 'Record not found', 404)
    }
  }

  // Unknown / unexpected — log full detail server-side, return generic message
  logger.error({ err }, 'Unhandled error')
  return sendError(res, isDev && err instanceof Error ? err.message : 'Internal server error', 500)
}
