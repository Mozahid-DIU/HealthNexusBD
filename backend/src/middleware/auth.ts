import type { NextFunction, Request, Response } from 'express'
import { prisma } from '../config/prisma.ts'
import { verifyAccessToken } from '../utils/jwt.ts'
import { AppError } from '../utils/AppError.ts'

/**
 * Require a valid access token AND a still-valid session. Attaches { id, role } to req.user.
 *
 * The JWT alone is not trusted for the account's current state: each request re-reads
 * the user (one primary-key lookup) so that suspension, rejection, logout and password
 * reset take effect on the very next request instead of when the token expires.
 * Those actions bump `tokenVersion`; a token carrying an older version is refused.
 */
export async function authenticate(req: Request, _res: Response, next: NextFunction): Promise<void> {
  const header = req.headers.authorization
  if (!header || !header.startsWith('Bearer ')) {
    return next(AppError.unauthorized('Missing or malformed Authorization header'))
  }
  const token = header.slice('Bearer '.length).trim()

  let payload
  try {
    payload = verifyAccessToken(token)
  } catch {
    return next(AppError.unauthorized('Invalid or expired token'))
  }

  let user
  try {
    user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { role: true, status: true, tokenVersion: true },
    })
  } catch (err) {
    return next(err)
  }

  if (!user || payload.ver !== user.tokenVersion) {
    return next(AppError.unauthorized('Session is no longer valid. Please log in again.'))
  }
  if (user.status === 'suspended') {
    return next(AppError.forbidden('This account has been suspended. Contact the administrator.'))
  }
  // Role comes from the database, so a stale token can never carry an outdated role.
  req.user = { id: payload.sub, role: user.role }
  next()
}
