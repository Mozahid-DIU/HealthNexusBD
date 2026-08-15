import type { NextFunction, Request, Response } from 'express'
import { verifyAccessToken } from '../utils/jwt.ts'
import { AppError } from '../utils/AppError.ts'

/**
 * Require a valid access token. Attaches { id, role } to req.user.
 */
export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization
  if (!header || !header.startsWith('Bearer ')) {
    return next(AppError.unauthorized('Missing or malformed Authorization header'))
  }
  const token = header.slice('Bearer '.length).trim()
  try {
    const payload = verifyAccessToken(token)
    req.user = { id: payload.sub, role: payload.role }
    next()
  } catch {
    next(AppError.unauthorized('Invalid or expired token'))
  }
}
