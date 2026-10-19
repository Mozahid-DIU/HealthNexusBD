import { env } from '../config/env.ts'
import { logger } from '../utils/logger.ts'

/**
 * SMS delivery (consent/OTP codes and patient notifications).
 *
 * Two modes, switched by OTP_MODE in .env:
 *   - "demo": no real SMS is sent. The code is logged server-side (and surfaced to
 *     the caller) so the flow can be demoed/tested without a live gateway or balance.
 *   - "real": sends via BulkSMSBD. Requires SMS_API_KEY and SMS_SENDER_ID.
 *
 * The rest of the app never branches on the mode — it just calls sendSms/sendOtpSms and
 * reads the returned { delivered, mode }. Switching to real SMS is a .env change only.
 */

export type OtpMode = 'demo' | 'real'

export interface SmsResult {
  delivered: boolean
  mode: OtpMode
}

function buildMessage(code: string, purpose: string): string {
  return (
    `HealthNexus BD: Your ${purpose} verification code is ${code}. ` +
    `It expires in ${env.OTP_TTL_MINUTES} minutes. ` +
    `Share it only with your treating doctor.`
  )
}

export async function sendOtpSms(
  phone: string,
  code: string,
  purpose = 'access',
): Promise<SmsResult> {
  if (env.OTP_MODE === 'demo') {
    // `code` is intentionally logged in demo mode so it can be read from the console.
    logger.info({ phone, code, purpose }, '📨 [DEMO] OTP SMS — not actually sent')
    return { delivered: false, mode: 'demo' }
  }
  return sendSms(phone, buildMessage(code, purpose), purpose)
}

/** Send any text message. `purpose` is only used for logs. */
export async function sendSms(phone: string, message: string, purpose: string): Promise<SmsResult> {
  if (env.OTP_MODE === 'demo') {
    logger.info({ phone, purpose, message }, '📨 [DEMO] SMS — not actually sent')
    return { delivered: false, mode: 'demo' }
  }

  // --- real delivery via BulkSMSBD ---
  if (!env.SMS_API_KEY || !env.SMS_SENDER_ID) {
    throw new Error('SMS_API_KEY and SMS_SENDER_ID must be set when OTP_MODE=real')
  }

  const body = new URLSearchParams({
    api_key: env.SMS_API_KEY,
    senderid: env.SMS_SENDER_ID,
    number: phone,
    message,
  })

  const res = await fetch(env.SMS_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  })

  const payload = await res.text()
  if (!res.ok) {
    logger.error({ status: res.status, payload }, 'SMS gateway returned an error')
    throw new Error(`Failed to send ${purpose} SMS`)
  }

  logger.info({ phone, purpose, gateway: payload }, 'SMS dispatched')
  return { delivered: true, mode: 'real' }
}
