import type { Language } from '@/i18n'

/** All clinical times are shown in Bangladesh time, wherever the viewer is. */
export const TIME_ZONE = 'Asia/Dhaka'

const LOCALE: Record<Language, string> = { en: 'en-GB', bn: 'bn-BD' }

type DateInput = string | number | Date | null | undefined

function toDate(value: DateInput): Date | null {
  if (value === null || value === undefined || value === '') return null
  const date = value instanceof Date ? value : new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

interface DateOptions {
  /** For DB DATE columns (sent as midnight UTC): format the calendar day as stored. */
  dateOnly?: boolean
}

/** e.g. "11 Mar 2026" / "১১ মার্চ, ২০২৬". Empty string for missing/invalid input. */
export function formatDate(value: DateInput, lang: Language, opts: DateOptions = {}): string {
  const date = toDate(value)
  if (!date) return ''
  return new Intl.DateTimeFormat(LOCALE[lang], {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: opts.dateOnly ? 'UTC' : TIME_ZONE,
  }).format(date)
}

/**
 * e.g. "11 Mar 2026, 22:13" / "১১ মার্চ, ২০২৬, ২২:১৩". Always a 24-hour clock: the Bangla
 * locale's 12-hour format would otherwise put a Latin "AM/PM" among Bangla digits.
 */
export function formatDateTime(value: DateInput, lang: Language): string {
  const date = toDate(value)
  if (!date) return ''
  return new Intl.DateTimeFormat(LOCALE[lang], {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
    timeZone: TIME_ZONE,
  }).format(date)
}

/** e.g. "Wednesday, 11 March 2026" / "বুধবার, ১১ মার্চ, ২০২৬". */
export function formatLongDate(value: DateInput, lang: Language): string {
  const date = toDate(value)
  if (!date) return ''
  return new Intl.DateTimeFormat(LOCALE[lang], {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: TIME_ZONE,
  }).format(date)
}

/** Today's calendar date in Bangladesh as "YYYY-MM-DD" (UTC would be a day behind before 06:00). */
export function todayIso(now: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: TIME_ZONE }).format(now)
}

export function formatNumber(value: number, lang: Language): string {
  return new Intl.NumberFormat(LOCALE[lang]).format(value)
}

const MB = 1024 * 1024

/** "47 KB" / "2.5 MB", in the reader's digits. Never "0.0 MB" for a small file. */
export function formatFileSize(bytes: number, lang: Language): string {
  if (bytes < MB) return `${formatNumber(Math.max(1, Math.round(bytes / 1024)), lang)} KB`
  const mb = new Intl.NumberFormat(LOCALE[lang], { maximumFractionDigits: 1 }).format(bytes / MB)
  return `${mb} MB`
}

/** Up to two initials for an avatar, skipping titles like "Dr.". */
export function initials(name: string): string {
  const words = name
    .split(/\s+/)
    .filter((w) => w && !/^(dr|prof|mr|mrs|ms)\.?$/i.test(w))
  if (words.length === 0) return '?'
  return words
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join('')
}
