import express from 'express'
import helmet from 'helmet'
import cors from 'cors'
import { pinoHttp } from 'pino-http'
import { env } from './config/env.ts'
import { logger } from './utils/logger.ts'
import { errorHandler, notFoundHandler } from './middleware/error.ts'
import { apiLimiter } from './middleware/rateLimit.ts'
import { healthRouter } from './modules/health/health.routes.ts'
import { authRouter } from './modules/auth/auth.routes.ts'
import { consentRouter } from './modules/consent/consent.routes.ts'
import { adminRouter } from './modules/admin/admin.routes.ts'
import { doctorRouter } from './modules/doctor/doctor.routes.ts'
import { patientRouter } from './modules/patient/patient.routes.ts'
import { labRouter } from './modules/lab/lab.routes.ts'

export function createApp() {
  const app = express()

  // Security & platform middleware
  app.disable('x-powered-by')
  app.use(helmet())
  app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }))
  app.use(express.json({ limit: '1mb' }))
  app.use(express.urlencoded({ extended: true }))
  app.use(pinoHttp({ logger }))

  // General rate limit across the API surface (auth/OTP routes add a stricter limiter)
  app.use('/api', apiLimiter)

  // Routes
  app.use('/api/health', healthRouter)
  app.use('/api/auth', authRouter)
  app.use('/api/consent', consentRouter)
  app.use('/api/admin', adminRouter)
  app.use('/api/doctor', doctorRouter)
  app.use('/api/patient', patientRouter)
  app.use('/api/lab', labRouter)

  // 404 + global error handler (must be last)
  app.use(notFoundHandler)
  app.use(errorHandler)

  return app
}
