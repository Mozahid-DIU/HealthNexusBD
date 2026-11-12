/**
 * Doctors type test names freely ("CBC", "cbc ", "Lipid  Profile"). Labs must treat those
 * as one test, so names are compared by this key; the original text is kept for display.
 */
export function cleanTestName(name: string): string {
  return name.trim().replace(/\s+/g, ' ')
}

export function testKey(name: string): string {
  return cleanTestName(name).toLowerCase()
}
