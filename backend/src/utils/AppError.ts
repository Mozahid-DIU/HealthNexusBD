/**
 * Stable, machine-readable error codes. Clients branch on these instead of matching
 * message text (which is for humans and may change or be translated).
 */
export type ErrorCode =
  | 'TOKEN_INVALID' // missing / malformed / expired access token — the client may refresh
  | 'SESSION_INVALID' // token revoked (logout, suspension, password reset) — log in again
  | 'ACCOUNT_SUSPENDED' // account suspended by an admin — sign the user out
  | 'ACCOUNT_PENDING' // doctor/lab not yet verified — show the pending screen
  | 'CONSENT_REQUIRED' // doctor has no live consent for this patient — access has ended
  | 'TEST_NOT_PRESCRIBED' // lab upload for a test no doctor prescribed for this patient
  | 'INVALID_FILE' // upload is not a real PDF
  | 'FILE_TOO_LARGE' // upload exceeds MAX_UPLOAD_MB
  | 'FILE_REQUIRED' // upload request without a file
  | 'NEEDS_VERIFICATION' // reactivating a doctor/lab that was never verified: use Verifications

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

  static badRequest(msg = 'Bad request', code?: ErrorCode) {
    return new AppError(msg, 400, code)
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
  static conflict(msg = 'Conflict', code?: ErrorCode) {
    return new AppError(msg, 409, code)
  }
  static tooMany(msg = 'Too many requests') {
    return new AppError(msg, 429)
  }
}
