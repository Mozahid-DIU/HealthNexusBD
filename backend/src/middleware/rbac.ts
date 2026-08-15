import type { NextFunction, Request, Response } from 'express'
import type { UserRole } from '@prisma/client'
import { AppError } from '../utils/AppError.ts'

/**
 * Restrict a route to one or more roles. Must run after `authenticate`.
 */
export function requireRole(...roles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) return next(AppError.unauthorized())
    if (!roles.includes(req.user.role)) {
      return next(AppError.forbidden('You do not have permission to access this resource'))
    }
    next()
  }
}
