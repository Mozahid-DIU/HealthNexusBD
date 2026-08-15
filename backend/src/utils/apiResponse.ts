import type { Response } from 'express'

/**
 * Consistent response envelope for the whole API:
 * { success, data, error, meta }
 */
export interface PaginationMeta {
  total: number
  page: number
  limit: number
}

export function sendSuccess<T>(
  res: Response,
  data: T,
  status = 200,
  meta?: PaginationMeta,
): Response {
  return res.status(status).json({ success: true, data, error: null, ...(meta ? { meta } : {}) })
}

export function sendError(res: Response, message: string, status = 400): Response {
  return res.status(status).json({ success: false, data: null, error: message })
}
