import { describe, expect, it } from 'vitest'
import { envSchema, resolveOtpMode } from '../../src/config/env.ts'

describe('OTP mode', () => {
  it('fails closed in production: an unset mode means real SMS, never an on-screen code', () => {
    expect(resolveOtpMode('production', undefined)).toBe('real')
  })

  it('defaults to demo for local development and tests', () => {
    expect(resolveOtpMode('development', undefined)).toBe('demo')
    expect(resolveOtpMode('test', undefined)).toBe('demo')
  })

  it('honours an explicit choice (e.g. a hosted demo for the defense)', () => {
    expect(resolveOtpMode('production', 'demo')).toBe('demo')
    expect(resolveOtpMode('development', 'real')).toBe('real')
  })
})

describe('environment defaults', () => {
  const minimal = {
    DATABASE_URL: 'postgresql://u:p@localhost:5432/db',
    JWT_ACCESS_SECRET: 'x'.repeat(32),
    JWT_REFRESH_SECRET: 'y'.repeat(32),
    AES_SECRET_KEY: 'a1'.repeat(32),
  }

  it('treats a missing NODE_ENV as production, so dev-only shortcuts stay off', () => {
    const parsed = envSchema.parse(minimal)
    expect(parsed.NODE_ENV).toBe('production')
    expect(resolveOtpMode(parsed.NODE_ENV, parsed.OTP_MODE)).toBe('real')
  })
})
