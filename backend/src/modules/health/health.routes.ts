import { Router } from 'express'
import { prisma } from '../../config/prisma.ts'
import { sendSuccess, sendError } from '../../utils/apiResponse.ts'
import { asyncHandler } from '../../utils/asyncHandler.ts'

export const healthRouter = Router()

/**
 * GET /api/health — liveness + database readiness check.
 */
healthRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    try {
      await prisma.$queryRaw`SELECT 1`
      return sendSuccess(res, {
        status: 'ok',
        database: 'connected',
        uptime: Math.round(process.uptime()),
        timestamp: new Date().toISOString(),
      })
    } catch {
      return sendError(res, 'Database not reachable', 503)
    }
  }),
)
