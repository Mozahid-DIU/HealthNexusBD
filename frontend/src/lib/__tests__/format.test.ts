import { describe, expect, it } from 'vitest'
import { formatDate, formatDateTime, formatLongDate, formatNumber, initials } from '../format'

// 2026-03-10 20:30 UTC is 2026-03-11 02:30 in Dhaka (UTC+6).
const LATE_NIGHT_UTC = '2026-03-10T20:30:00Z'

describe('format', () => {
  it('formats dates in Bangladesh time, not the browser time zone', () => {
    expect(formatDate(LATE_NIGHT_UTC, 'en')).toBe('11 Mar 2026')
  })

  it('uses Bangla digits and month names in Bangla', () => {
    const bn = formatDate(LATE_NIGHT_UTC, 'bn')
    expect(bn).toMatch(/১১/)
    expect(bn).toMatch(/২০২৬/)
    expect(bn).not.toMatch(/\d/)
  })

  it('formats date-only values (DB DATE columns) without shifting the day', () => {
    // A DATE comes back as midnight UTC; it must stay the same calendar day.
    expect(formatDate('2026-03-11T00:00:00.000Z', 'en', { dateOnly: true })).toBe('11 Mar 2026')
  })

  it('formats date and time', () => {
    expect(formatDateTime(LATE_NIGHT_UTC, 'en')).toMatch(/11 Mar 2026.*2:30/)
  })

  it('formats a long date with the weekday, in Dhaka time', () => {
    expect(formatLongDate(LATE_NIGHT_UTC, 'en')).toBe('Wednesday, 11 March 2026')
    expect(formatLongDate(LATE_NIGHT_UTC, 'bn')).toMatch(/বুধবার/)
  })

  it('formats numbers per language', () => {
    expect(formatNumber(1234, 'en')).toBe('1,234')
    expect(formatNumber(1234, 'bn')).toBe('১,২৩৪')
  })

  it('returns an empty string for missing or invalid dates instead of "Invalid Date"', () => {
    expect(formatDate(null, 'en')).toBe('')
    expect(formatDate('not-a-date', 'en')).toBe('')
    expect(formatDateTime(undefined, 'bn')).toBe('')
  })

  it('builds initials for avatars', () => {
    expect(initials('Rahim Uddin')).toBe('RU')
    expect(initials('Dr. Ayesha Karim')).toBe('AK')
    expect(initials('PathCare')).toBe('P')
    expect(initials('')).toBe('?')
  })
})
