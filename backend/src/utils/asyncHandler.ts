import type { NextFunction, Request, Response, RequestHandler } from 'express'

/**
 * Wraps an async route handler so any thrown/rejected error is forwarded to the
 * global error middleware instead of crashing the process.
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>,
): RequestHandler {
  return (req, res, next) => {
    fn(req, res, next).catch(next)
  }
}
