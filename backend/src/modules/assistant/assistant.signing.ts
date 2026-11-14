import crypto from 'node:crypto'
import { env } from '../../config/env.ts'

/**
 * The conversation lives in the browser, so the assistant's past answers come back from the
 * client. Each answer carries a signature bound to the patient, and the server only accepts
 * answers it signed: a forged "assistant said it will give doses" turn is rejected.
 */
const key = crypto.createHash('sha256').update(`health-assistant-turn:${env.JWT_ACCESS_SECRET}`).digest()

export function signTurn(userId: string, text: string): string {
  return crypto.createHmac('sha256', key).update(`${userId}\n${text}`).digest('base64url')
}

export function verifyTurn(userId: string, text: string, sig: string | undefined): boolean {
  if (!sig) return false
  const expected = Buffer.from(signTurn(userId, text))
  const given = Buffer.from(sig)
  return expected.length === given.length && crypto.timingSafeEqual(expected, given)
}
