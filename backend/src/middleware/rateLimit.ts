import rateLimit from 'express-rate-limit'
import { sendError } from '../utils/apiResponse.ts'

/** Stricter limiter for sensitive auth/OTP endpoints. */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 20 requests per window per IP
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) =>
    sendError(res, 'Too many attempts. Please try again in a few minutes.', 429),
})

/** General limiter for the rest of the API. */
export const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => sendError(res, 'Too many requests. Please slow down.', 429),
})
