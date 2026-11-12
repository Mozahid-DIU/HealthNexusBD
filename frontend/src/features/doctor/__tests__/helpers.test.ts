import { describe, expect, it } from 'vitest'
import { parseIdentifier } from '@/lib/identifier'
import { ageFrom, formatCountdown } from '../helpers'

describe('parseIdentifier', () => {
  it('recognises a UHID in any case and with spaces', () => {
    expect(parseIdentifier(' bd-2026-01240 ')).toEqual({ uhid: 'BD-2026-01240' })
  })
  it('recognises a Bangladeshi mobile number, also with +88 or spaces', () => {
    expect(parseIdentifier('01810000007')).toEqual({ phone: '01810000007' })
    expect(parseIdentifier('+880 1810-000007')).toEqual({ phone: '01810000007' })
    expect(parseIdentifier('8801810000007')).toEqual({ phone: '01810000007' })
  })
  it('accepts Bangla digits, as typed on a Bangla keyboard', () => {
    expect(parseIdentifier('০১৮১০০০০০০৭')).toEqual({ phone: '01810000007' })
    expect(parseIdentifier('BD-২০২৬-০১২৪০')).toEqual({ uhid: 'BD-2026-01240' })
  })
  it('rejects anything else', () => {
    for (const bad of ['', 'BD-26-1', '0181000000', '12345678901', 'hello']) {
      expect(parseIdentifier(bad)).toBeNull()
    }
  })
})

describe('ageFrom', () => {
  const now = new Date('2026-11-10T12:00:00Z')
  it('counts whole years, not yet a birthday this year', () => {
    expect(ageFrom('1990-11-11T00:00:00.000Z', now)).toBe(35)
    expect(ageFrom('1990-11-10T00:00:00.000Z', now)).toBe(36)
  })
  it('returns null for missing or invalid dates', () => {
    expect(ageFrom(null, now)).toBeNull()
    expect(ageFrom('nope', now)).toBeNull()
  })
})

describe('formatCountdown', () => {
  it('shows m:ss and never goes negative', () => {
    expect(formatCountdown(299_000)).toBe('4:59')
    expect(formatCountdown(65_000)).toBe('1:05')
    expect(formatCountdown(-5)).toBe('0:00')
  })
})
