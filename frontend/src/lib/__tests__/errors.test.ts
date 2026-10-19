import { describe, expect, it } from 'vitest'
import { i18n } from '@/i18n'
import { ApiError } from '../api'
import { translateApiError } from '../errors'

const tr = (error: unknown) => translateApiError(error, i18n.t)

describe('translateApiError', () => {
  it('maps stable codes', () => {
    expect(tr(new ApiError('x', 0, 'NETWORK'))).toBe(i18n.t('errors.network'))
    expect(tr(new ApiError('x', 403, 'ACCOUNT_SUSPENDED'))).toBe(i18n.t('errors.accountSuspended'))
    expect(tr(new ApiError('x', 401, 'SESSION_INVALID'))).toBe(i18n.t('errors.sessionExpired'))
    expect(tr(new ApiError('x', 403, 'ACCOUNT_PENDING'))).toBe(i18n.t('errors.accountPending'))
  })

  it('maps rate limits and server errors to friendly text', () => {
    expect(tr(new ApiError('Too many requests. Please slow down.', 429))).toBe(i18n.t('errors.rateLimited'))
    expect(tr(new ApiError('Internal server error', 500))).toBe(i18n.t('errors.generic'))
  })

  it('maps known backend messages, in the active language', async () => {
    await i18n.changeLanguage('bn')
    expect(tr(new ApiError('Invalid credentials', 401))).toBe('ইমেইল/ফোন বা পাসওয়ার্ড ভুল।')
    expect(tr(new ApiError('A record with this email already exists', 409))).toBe(i18n.t('errors.duplicateEmail'))
    expect(tr(new ApiError('A record with this phone already exists', 409))).toBe(i18n.t('errors.duplicatePhone'))
    expect(tr(new ApiError('This BMDC number is already registered', 409))).toBe(i18n.t('errors.bmdcClaimed'))
    expect(tr(new ApiError('This code has expired. Please request a new one.', 400))).toBe(i18n.t('errors.codeExpired'))
  })

  it('hides raw server validation text behind a friendly message', () => {
    expect(tr(new ApiError('phone: Phone must be a valid Bangladeshi number', 400))).toBe(i18n.t('errors.invalidInput'))
    expect(tr(new ApiError('x', 401, 'TOKEN_INVALID'))).toBe(i18n.t('errors.sessionExpired'))
  })

  it('keeps the remaining-attempts count', () => {
    expect(tr(new ApiError('Invalid code. 3 attempt(s) remaining.', 400))).toBe(
      'That code is not correct. 3 attempt(s) left.',
    )
  })

  it('translates the client’s own message keys', () => {
    expect(tr(new ApiError('errors.generic', 418))).toBe(i18n.t('errors.generic'))
  })

  it('passes unknown server messages through, but never leaks non-API errors', () => {
    expect(tr(new ApiError('"CBC" was not prescribed for this patient', 403))).toBe(
      '"CBC" was not prescribed for this patient',
    )
    expect(tr(new TypeError('Cannot read properties of undefined'))).toBe(i18n.t('errors.generic'))
    expect(tr('boom')).toBe(i18n.t('errors.generic'))
  })
})
