import { describe, expect, it } from 'vitest'
import { formatDate, formatDateTime, formatDay, formatFileSize, formatLongDate, formatNumber, formatRelative, initials, todayIso } from '../format'

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

  it('formats date and time on a 24-hour clock', () => {
    expect(formatDateTime(LATE_NIGHT_UTC, 'en')).toMatch(/11 Mar 2026.*02:30/)
    expect(formatDateTime('2026-11-10T16:13:00Z', 'en')).toMatch(/22:13/)
  })

  it('never mixes Latin AM/PM into Bangla times', () => {
    const bn = formatDateTime('2026-11-10T16:13:00Z', 'bn')
    expect(bn).toMatch(/২২:১৩/)
    expect(bn).not.toMatch(/[A-Za-z]/)
  })

  it('formats a long date with the weekday, in Dhaka time', () => {
    expect(formatLongDate(LATE_NIGHT_UTC, 'en')).toBe('Wednesday, 11 March 2026')
    expect(formatLongDate(LATE_NIGHT_UTC, 'bn')).toMatch(/বুধবার/)
  })

  it("gives today's date in Bangladesh, not UTC", () => {
    // 01:00 on 11 Mar in Dhaka is still 10 Mar in UTC.
    expect(todayIso(new Date('2026-03-10T19:00:00Z'))).toBe('2026-03-11')
  })

  it('formats numbers per language', () => {
    expect(formatNumber(1234, 'en')).toBe('1,234')
    expect(formatNumber(1234, 'bn')).toBe('১,২৩৪')
  })

  it('labels a calendar day briefly, without shifting it across time zones', () => {
    expect(formatDay('2026-11-05', 'en')).toBe('5 Nov')
    expect(formatDay('2026-11-05', 'bn')).toMatch(/^৫ নভে/)
  })

  it('says how long ago something happened', () => {
    const now = new Date('2026-11-12T10:00:00Z')
    expect(formatRelative('2026-11-12T09:59:40Z', 'en', now)).toBe('now')
    expect(formatRelative('2026-11-12T09:55:00Z', 'en', now)).toBe('5 minutes ago')
    expect(formatRelative('2026-11-12T07:00:00Z', 'en', now)).toBe('3 hours ago')
    expect(formatRelative('2026-11-11T09:00:00Z', 'en', now)).toBe('yesterday')
    expect(formatRelative('2026-11-02T09:00:00Z', 'en', now)).toBe('10 days ago')
    expect(formatRelative('2026-11-12T09:55:00Z', 'bn', now)).toMatch(/৫ মিনিট/)
  })

  it('shows file sizes people can read, in the reader’s digits', () => {
    expect(formatFileSize(48_000, 'en')).toBe('47 KB')
    expect(formatFileSize(300, 'en')).toBe('1 KB')
    expect(formatFileSize(2.45 * 1024 * 1024, 'en')).toBe('2.5 MB')
    expect(formatFileSize(10 * 1024 * 1024, 'bn')).toBe('১০ MB')
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
