import type { TFunction } from 'i18next'
import type { TranslationKey } from '@/i18n'
import { ApiError } from './api'

const BY_CODE: Partial<Record<NonNullable<ApiError['code']>, TranslationKey>> = {
  NETWORK: 'errors.network',
  TOKEN_INVALID: 'errors.sessionExpired',
  SESSION_INVALID: 'errors.sessionExpired',
  ACCOUNT_SUSPENDED: 'errors.accountSuspended',
  ACCOUNT_PENDING: 'errors.accountPending',
}

/** Known backend messages → translated text. Anything unmatched is shown as sent. */
const BY_MESSAGE: Array<[RegExp, TranslationKey]> = [
  [/^Invalid credentials$/i, 'errors.invalidCredentials'],
  [/BMDC number is not in/i, 'errors.bmdcNotFound'],
  [/BMDC number is already registered/i, 'errors.bmdcClaimed'],
  [/licen[cs]e number is not in/i, 'errors.licenseNotFound'],
  [/licen[cs]e number is already registered/i, 'errors.licenseClaimed'],
  [/code has expired/i, 'errors.codeExpired'],
  [/No active reset request/i, 'errors.noResetRequest'],
  [/^Invalid (email or )?code\.?$/i, 'errors.invalidCode'],
]

const DUPLICATE_FIELD: Array<[RegExp, TranslationKey]> = [
  [/email/i, 'errors.duplicateEmail'],
  [/phone/i, 'errors.duplicatePhone'],
  [/nid/i, 'errors.duplicateNid'],
]

/**
 * A safe, translated message for any thrown value. Unexpected errors never leak
 * their internals to the user — they get the generic message.
 */
export function translateApiError(error: unknown, t: TFunction): string {
  if (!(error instanceof ApiError)) return t('errors.generic')

  const byCode = error.code && BY_CODE[error.code]
  if (byCode) return t(byCode)
  if (error.status === 429) return t('errors.rateLimited')
  if (error.status >= 500) return t('errors.generic')

  const message = error.message
  // Our own client-side messages are already translation keys.
  if (message.startsWith('errors.')) return t(message as TranslationKey)

  const attempts = message.match(/^Invalid code\. (\d+) attempt/i)
  if (attempts) return t('errors.invalidCodeAttempts', { count: Number(attempts[1]) })

  if (/already exists/i.test(message)) {
    const field = DUPLICATE_FIELD.find(([re]) => re.test(message))
    return field ? t(field[1]) : message
  }
  const known = BY_MESSAGE.find(([re]) => re.test(message))
  if (known) return t(known[1])
  // Server-side validation text ("field.path: reason; …") is for developers, not users.
  if (error.status === 400 && /^[\w.]+: /.test(message)) return t('errors.invalidInput')
  return message
}
