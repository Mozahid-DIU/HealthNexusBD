/**
 * Operational error with an HTTP status code. Throw this from services/controllers;
 * the global error middleware maps it to a safe JSON response.
 */
export class AppError extends Error {
  public readonly statusCode: number
  public readonly isOperational: boolean

  constructor(message: string, statusCode = 400) {
    super(message)
    this.statusCode = statusCode
    this.isOperational = true
    Object.setPrototypeOf(this, AppError.prototype)
  }

  static badRequest(msg = 'Bad request') {
    return new AppError(msg, 400)
  }
  static unauthorized(msg = 'Unauthorized') {
    return new AppError(msg, 401)
  }
  static forbidden(msg = 'Forbidden') {
    return new AppError(msg, 403)
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
