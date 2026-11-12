import { describe, expect, it } from 'vitest'

/**
 * Area strings load only with their own dashboard section, so a page may only use its
 * own area's keys (plus core keys). Type checking can't catch this: every key is valid
 * globally. This guards against e.g. a doctor page rendering a raw 'patient.*' key.
 */
const sources = import.meta.glob<string>('/src/features/**/*.{ts,tsx}', { query: '?raw', import: 'default', eager: true })

const AREAS = ['patient', 'doctor', 'lab', 'admin', 'landing'] as const

describe('i18n area boundaries', () => {
  for (const area of AREAS) {
    it(`features/${area} only uses its own area keys`, () => {
      const offenders: string[] = []
      for (const [path, text] of Object.entries(sources)) {
        if (!path.includes(`/features/${area}/`) || path.includes('__tests__')) continue
        for (const other of AREAS) {
          if (other === area) continue
          // `[.]` is a literal dot (no escaping pitfalls inside a template string).
          const hits = text.match(new RegExp(`['\`]${other}[.][a-zA-Z]`, 'g'))
          if (hits) offenders.push(`${path}: ${hits.join(', ')}`)
        }
      }
      expect(offenders).toEqual([])
    })
  }

  it('shared (non-area) features use no area keys at all', () => {
    const offenders: string[] = []
    for (const [path, text] of Object.entries(sources)) {
      if (AREAS.some((a) => path.includes(`/features/${a}/`)) || path.includes('__tests__')) continue
      const hits = text.match(new RegExp(`['\`](${AREAS.join('|')})[.][a-zA-Z]`, 'g'))
      if (hits) offenders.push(`${path}: ${hits.join(', ')}`)
    }
    expect(offenders).toEqual([])
  })
})
