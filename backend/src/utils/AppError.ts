/**
 * Stable, machine-readable error codes. Clients branch on these instead of matching
 * message text (which is for humans and may change or be translated).
 */
export type ErrorCode =
  | 'TOKEN_INVALID' // missing / malformed / expired access token — the client may refresh
  | 'SESSION_INVALID' // token revoked (logout, suspension, password reset) — log in again
  | 'ACCOUNT_SUSPENDED' // account suspended by an admin — sign the user out
  | 'ACCOUNT_PENDING' // doctor/lab not yet verified — show the pending screen

/**
 * Operational error with an HTTP status code (and optionally a stable `code`). Throw
 * this from services/controllers; the global error middleware maps it to safe JSON.
 */
export class AppError extends Error {
  public readonly statusCode: number
  public readonly isOperational: boolean
  public readonly code?: ErrorCode

  constructor(message: string, statusCode = 400, code?: ErrorCode) {
    super(message)
    this.statusCode = statusCode
    this.isOperational = true
    this.code = code
    Object.setPrototypeOf(this, AppError.prototype)
  }

  static badRequest(msg = 'Bad request') {
    return new AppError(msg, 400)
  }
  static unauthorized(msg = 'Unauthorized', code?: ErrorCode) {
    return new AppError(msg, 401, code)
  }
  static forbidden(msg = 'Forbidden', code?: ErrorCode) {
    return new AppError(msg, 403, code)
  }
  static notFound(msg = 'Not found') {
    return new AppError(msg, 404)
  }
  static conflict(msg = 'Conflict') {
    return new AppError(msg, 409)
  }
  static tooMany(msg = 'Too many requests') {
    return new AppError(msg, 429)
  }
}
