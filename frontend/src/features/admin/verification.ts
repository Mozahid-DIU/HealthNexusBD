/** Lower-case words without titles or punctuation: "Dr. Ayesha  Karim" → "ayesha karim". */
function normalise(name: string): string {
  return name
    .toLowerCase()
    .replace(/\b(dr|prof|mr|mrs|ms)\b\.?/g, ' ')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()
}

/** Whether a submitted name is the registry's name, give or take formatting. */
export function namesMatch(submitted: string, registry: string): boolean {
  return normalise(submitted) === normalise(registry)
}
