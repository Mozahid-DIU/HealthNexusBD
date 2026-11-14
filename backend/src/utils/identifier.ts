/** An account looked up by what the person typed: an email address or a mobile number. */
export type AccountLookup = { email: string } | { phone: string }

const MOBILE = /^01\d{9}$/

/** Bangla keyboards type ০-৯. */
function asciiDigits(text: string): string {
  return text.replace(/[০-৯]/g, (d) => String(d.charCodeAt(0) - 0x09e6))
}

/**
 * Accept an email (any case) or a Bangladeshi mobile number as people actually type it:
 * with or without +880/880, spaces, dashes or brackets, in English or Bangla digits.
 * Returns null when it is neither.
 */
export function parseAccountIdentifier(raw: string): AccountLookup | null {
  const text = asciiDigits(raw.trim())
  if (text.includes('@')) return { email: text.toLowerCase() }

  let digits = text.replace(/[\s()-]/g, '').replace(/^\+/, '')
  if (digits.startsWith('880')) digits = digits.slice(2) // 8801XXXXXXXXX → 01XXXXXXXXX
  return MOBILE.test(digits) ? { phone: digits } : null
}
