import type { Response } from 'express'
import type { ErrorCode } from './AppError.ts'

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

export function sendError(res: Response, message: string, status = 400, code?: ErrorCode): Response {
  return res
    .status(status)
    .json({ success: false, data: null, error: message, ...(code ? { code } : {}) })
}

/**
 * Stream a decrypted PDF to the client. `no-store` keeps medical documents out of
 * browser and proxy caches; `inline` lets the browser preview it.
 */
export function sendPdf(res: Response, pdf: Buffer, filename: string): Response {
  const safeName = filename.replace(/[^\w.-]+/g, '_').slice(0, 100) || 'report'
  res.setHeader('Content-Type', 'application/pdf')
  res.setHeader('Content-Disposition', `inline; filename="${safeName}.pdf"`)
  res.setHeader('Cache-Control', 'no-store')
  return res.status(200).send(pdf)
}
