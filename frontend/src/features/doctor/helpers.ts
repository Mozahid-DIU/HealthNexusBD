const UHID = /^BD-\d{4}-\d{5}$/
const MOBILE = /^01\d{9}$/

/**
 * Accept what a doctor actually types: a UHID in any case, or a mobile number with or
 * without +880 / spaces / dashes. Returns the query the API expects, or null.
 */
export function parseIdentifier(raw: string): { uhid: string } | { phone: string } | null {
  const text = raw.trim().toUpperCase()
  if (UHID.test(text)) return { uhid: text }
  let digits = text.replace(/[\s()-]/g, '').replace(/^\+/, '')
  if (digits.startsWith('880')) digits = digits.slice(2) // 8801XXXXXXXXX → 01XXXXXXXXX
  return MOBILE.test(digits) ? { phone: digits } : null
}

/** Whole years since `dateOfBirth` (a DB DATE, i.e. midnight UTC), or null. */
export function ageFrom(dateOfBirth: string | null | undefined, now: Date = new Date()): number | null {
  if (!dateOfBirth) return null
  const dob = new Date(dateOfBirth)
  if (Number.isNaN(dob.getTime())) return null
  let age = now.getUTCFullYear() - dob.getUTCFullYear()
  const beforeBirthday =
    now.getUTCMonth() < dob.getUTCMonth() ||
    (now.getUTCMonth() === dob.getUTCMonth() && now.getUTCDate() < dob.getUTCDate())
  if (beforeBirthday) age -= 1
  return age >= 0 ? age : null
}

/** Milliseconds left → "m:ss" (for the consent code timer). */
export function formatCountdown(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000))
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`
}
