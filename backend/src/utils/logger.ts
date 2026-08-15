import { pino } from 'pino'
import { isDev } from '../config/env.ts'

/**
 * Application logger. Pretty output in development, structured JSON in production.
 * Never log secrets, passwords, OTPs, or decrypted medical content.
 *
 * LOG_LEVEL overrides the default (e.g. "silent" for scripts/tests).
 */
export const logger = pino({
  level: process.env.LOG_LEVEL ?? (isDev ? 'debug' : 'info'),
  transport: isDev
    ? { target: 'pino-pretty', options: { colorize: true, translateTime: 'HH:MM:ss' } }
    : undefined,
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      '*.password',
      '*.passwordHash',
      '*.otp',
      '*.codeHash',
    ],
    remove: true,
  },
})
