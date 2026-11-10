import { describe, expect, it } from 'vitest'
import { resolveOtpMode } from '../../src/config/env.ts'

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
