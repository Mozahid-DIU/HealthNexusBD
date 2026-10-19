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

/** e.g. "11 Mar 2026, 2:30 am". */
export function formatDateTime(value: DateInput, lang: Language): string {
  const date = toDate(value)
  if (!date) return ''
  return new Intl.DateTimeFormat(LOCALE[lang], {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
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

export function formatNumber(value: number, lang: Language): string {
  return new Intl.NumberFormat(LOCALE[lang]).format(value)
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
