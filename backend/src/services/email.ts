import nodemailer from 'nodemailer'
import type { Transporter } from 'nodemailer'
import { env } from '../config/env.ts'
import { logger } from '../utils/logger.ts'

/**
 * Transactional email (password-reset OTP) via Gmail SMTP.
 *
 * Two modes, chosen by whether EMAIL_USER + EMAIL_APP_PASSWORD are set:
 *   - real: sends through Gmail using an App Password.
 *   - demo: no email is sent; the code is logged (and surfaced to the caller) so
 *     the flow can be tested without a mailbox.
 */

export type EmailMode = 'demo' | 'real'

export interface EmailResult {
  delivered: boolean
  mode: EmailMode
}

let transporter: Transporter | null = null
function getTransporter(): Transporter {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: env.EMAIL_USER, pass: env.EMAIL_APP_PASSWORD },
    })
  }
  return transporter
}

function isConfigured(): boolean {
  return Boolean(env.EMAIL_USER && env.EMAIL_APP_PASSWORD)
}

export async function sendPasswordResetOtp(to: string, code: string): Promise<EmailResult> {
  const subject = 'HealthNexus BD — Password reset code'
  const text =
    `Your password reset code is ${code}. ` +
    `It expires in ${env.OTP_TTL_MINUTES} minutes. ` +
    `If you did not request this, you can safely ignore this email.`
  const html =
    `<p>Your HealthNexus BD password reset code is:</p>` +
    `<p style="font-size:24px;font-weight:bold;letter-spacing:3px">${code}</p>` +
    `<p>It expires in ${env.OTP_TTL_MINUTES} minutes. If you did not request this, ignore this email.</p>`

  if (!isConfigured()) {
    logger.info({ to, code }, '📧 [DEMO] password reset OTP — not actually emailed')
    return { delivered: false, mode: 'demo' }
  }

  await getTransporter().sendMail({ from: env.EMAIL_FROM, to, subject, text, html })
  logger.info({ to }, 'Password reset OTP emailed')
  return { delivered: true, mode: 'real' }
}
