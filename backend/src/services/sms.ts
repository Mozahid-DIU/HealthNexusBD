import { env } from '../config/env.ts'
import { isDemoNumber } from '../config/demoNumbers.ts'
import { logger } from '../utils/logger.ts'

/**
 * SMS delivery (consent codes, password-reset codes and patient notifications).
 *
 * Switched by OTP_MODE in .env:
 *   - "demo": no real SMS is sent; the message is logged (outside production) so the
 *     flow can be demoed without a gateway or balance.
 *   - "real": sends via BulkSMSBD (SMS_API_KEY + SMS_SENDER_ID).
 *
 * Seeded demo accounts never get a real SMS, even in real mode (see demoNumbers.ts):
 * for them the result is the same as demo mode.
 *
 * The rest of the app never branches on the mode — it calls sendSms/sendOtpSms and
 * reads the returned { delivered, mode }.
 */

export type OtpMode = 'demo' | 'real'

export interface SmsResult {
  delivered: boolean
  mode: OtpMode
}

/** The gateway refused or could not be reached; `gatewayCode` is BulkSMSBD's own code. */
export class SmsError extends Error {
  constructor(
    message: string,
    public readonly gatewayCode?: number,
  ) {
    super(message)
    this.name = 'SmsError'
  }
}

/**
 * Real SMS cost money: at most this many go out per Dhaka day (SMS_DAILY_LIMIT), so a
 * bug or an abuser can never drain the balance. Counted in memory (one server).
 */
const budget = { day: '', sent: 0 }

function dhakaDay(): string {
  return new Date(Date.now() + 6 * 60 * 60_000).toISOString().slice(0, 10)
}

/** Tests only: start the day's count again. */
export function resetSmsBudget(): void {
  budget.day = ''
  budget.sent = 0
}

/** 01999123456 → 019*****456: enough to tell numbers apart in logs, not to read them. */
export function maskPhone(phone: string): string {
  return phone.length > 6 ? `${phone.slice(0, 3)}*****${phone.slice(-3)}` : '***'
}

/** True when a message to this number would only be logged, not really sent. */
export function smsIsSimulated(phone: string): boolean {
  return env.OTP_MODE === 'demo' || isDemoNumber(phone)
}

/** BulkSMSBD answers HTTP 200 for everything; this `response_code` means accepted. */
const GATEWAY_ACCEPTED = 202
const GATEWAY_TIMEOUT_MS = 10_000

/** Readable reasons for BulkSMSBD's most common refusals (for logs and errors). */
const GATEWAY_REASONS: Record<number, string> = {
  1001: 'invalid phone number',
  1002: 'sender ID is not correct or is disabled',
  1003: 'a required field is missing',
  1005: 'gateway internal error',
  1006: 'balance validity has expired',
  1007: 'insufficient balance',
  1011: 'SMS account not found',
  1018: 'SMS account is disabled',
  1031: 'SMS account is not verified',
  1032: 'this server IP is not whitelisted',
}

function buildOtpMessage(code: string, purpose: string): string {
  return (
    `HealthNexus BD: Your ${purpose} verification code is ${code}. ` +
    `It expires in ${env.OTP_TTL_MINUTES} minutes. ` +
    `Share it only with your treating doctor.`
  )
}

export async function sendOtpSms(phone: string, code: string, purpose = 'access'): Promise<SmsResult> {
  return sendSms(phone, buildOtpMessage(code, purpose), purpose)
}

/** Send any text message. `purpose` is only used for logs. Throws SmsError on failure. */
export async function sendSms(phone: string, message: string, purpose: string): Promise<SmsResult> {
  if (smsIsSimulated(phone)) {
    // Messages can carry codes: keep them out of production logs.
    const detail = env.NODE_ENV === 'production' ? {} : { message }
    logger.info({ phone: maskPhone(phone), purpose, ...detail }, '📨 [DEMO] SMS — not actually sent')
    return { delivered: false, mode: 'demo' }
  }

  if (!env.SMS_API_KEY || !env.SMS_SENDER_ID) {
    throw new SmsError('SMS_API_KEY and SMS_SENDER_ID must be set when OTP_MODE=real')
  }

  const today = dhakaDay()
  if (budget.day !== today) {
    budget.day = today
    budget.sent = 0
  }
  if (budget.sent >= env.SMS_DAILY_LIMIT) {
    logger.error({ purpose, limit: env.SMS_DAILY_LIMIT }, 'Daily SMS limit reached; message not sent')
    throw new SmsError('SMS not sent: daily SMS limit reached')
  }
  // Counted before sending, so a burst of parallel requests cannot overshoot the limit.
  budget.sent += 1

  const body = new URLSearchParams({
    api_key: env.SMS_API_KEY,
    type: 'text',
    senderid: env.SMS_SENDER_ID,
    number: phone,
    message,
  })

  let payload: string
  try {
    const res = await fetch(env.SMS_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
      signal: AbortSignal.timeout(GATEWAY_TIMEOUT_MS),
    })
    payload = await res.text()
  } catch (err) {
    logger.error({ err, purpose }, 'SMS gateway unreachable')
    throw new SmsError('SMS gateway unreachable')
  }

  const code = gatewayCode(payload)
  if (code !== GATEWAY_ACCEPTED) {
    const reason = (code !== undefined && GATEWAY_REASONS[code]) || 'unexpected gateway answer'
    logger.error({ phone: maskPhone(phone), purpose, gatewayCode: code, reason }, 'SMS gateway refused the message')
    throw new SmsError(`SMS not sent: ${reason}`, code)
  }

  logger.info({ phone: maskPhone(phone), purpose }, 'SMS dispatched')
  return { delivered: true, mode: 'real' }
}

function gatewayCode(payload: string): number | undefined {
  try {
    const parsed: unknown = JSON.parse(payload)
    const code = (parsed as { response_code?: unknown } | null)?.response_code
    return typeof code === 'number' ? code : typeof code === 'string' && /^\d+$/.test(code) ? Number(code) : undefined
  } catch {
    return undefined
  }
}
