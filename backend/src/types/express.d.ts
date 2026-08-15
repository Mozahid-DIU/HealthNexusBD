import type { UserRole } from '@prisma/client'

/** The authenticated principal attached to the request by the auth middleware. */
export interface AuthUser {
  id: string
  role: UserRole
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthUser
    }
  }
}

export {}
