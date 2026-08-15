import crypto from 'node:crypto'
import bcrypt from 'bcryptjs'

/**
 * One-time password helpers.
 *
 * Codes are 6 numeric digits, generated with a CSPRNG (crypto.randomInt) so they
 * are not predictable. Only the bcrypt hash is ever persisted — the plaintext code
 * lives only in memory long enough to be sent to the patient.
 */

/** OTPs are short-lived and low-value vs. passwords, so a lighter cost is fine. */
const OTP_SALT_ROUNDS = 8

/** Generate a zero-padded 6-digit code, e.g. "042198". */
export function generateOtpCode(): string {
  return crypto.randomInt(0, 1_000_000).toString().padStart(6, '0')
}

export async function hashOtp(code: string): Promise<string> {
  return bcrypt.hash(code, OTP_SALT_ROUNDS)
}

export async function verifyOtp(code: string, hash: string): Promise<boolean> {
  return bcrypt.compare(code, hash)
}
