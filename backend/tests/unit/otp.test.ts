import { describe, expect, it } from 'vitest'
import { generateOtpCode, hashOtp, verifyOtp } from '../../src/utils/otp.ts'

describe('OTP helpers', () => {
  it('generates 6-digit numeric codes, keeping leading zeros', () => {
    for (let i = 0; i < 200; i++) {
      expect(generateOtpCode()).toMatch(/^\d{6}$/)
    }
  })

  it('stores only a hash that verifies the right code and rejects others', async () => {
    const hash = await hashOtp('042198')

    expect(hash).not.toContain('042198')
    await expect(verifyOtp('042198', hash)).resolves.toBe(true)
    await expect(verifyOtp('042199', hash)).resolves.toBe(false)
  })
})
