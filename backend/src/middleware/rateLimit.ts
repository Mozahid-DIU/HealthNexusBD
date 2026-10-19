import rateLimit from 'express-rate-limit'
import { env } from '../config/env.ts'
import { sendError } from '../utils/apiResponse.ts'

// The test suite fires many requests from one IP; limits are not under test there.
// Both flags are required, so a deploy misconfigured with NODE_ENV=test keeps its limits.
const skipInTests = () => env.NODE_ENV === 'test' && process.env.VITEST === 'true'

/** Stricter limiter for sensitive auth/OTP endpoints. */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 20 requests per window per IP
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipInTests,
  handler: (_req, res) =>
    sendError(res, 'Too many attempts. Please try again in a few minutes.', 429),
})

/**
 * Token refresh gets its own, more generous budget. Every signed-in user refreshes about
 * once per access-token lifetime, and a whole clinic can share one public IP — counting
 * refreshes against the login/OTP limit would sign everyone out at once.
 */
export const refreshLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipInTests,
  handler: (_req, res) => sendError(res, 'Too many requests. Please slow down.', 429),
})

/** General limiter for the rest of the API. */
export const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipInTests,
  handler: (_req, res) => sendError(res, 'Too many requests. Please slow down.', 429),
})
