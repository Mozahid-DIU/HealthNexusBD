const UHID = /^BD-\d{4}-\d{5}$/
const MOBILE = /^01\d{9}$/

export type PatientQuery = { uhid: string } | { phone: string }

/**
 * Accept what staff actually type: a UHID in any case, or a mobile number with or
 * without +880 / spaces / dashes. Returns the query the API expects, or null.
 */
export function parseIdentifier(raw: string): PatientQuery | null {
  // A Bangla keyboard types ০-৯; the API expects 0-9.
  const text = raw.trim().toUpperCase().replace(/[০-৯]/g, (d) => String(d.charCodeAt(0) - 0x09e6))
  if (UHID.test(text)) return { uhid: text }
  let digits = text.replace(/[\s()-]/g, '').replace(/^\+/, '')
  if (digits.startsWith('880')) digits = digits.slice(2) // 8801XXXXXXXXX → 01XXXXXXXXX
  return MOBILE.test(digits) ? { phone: digits } : null
}
