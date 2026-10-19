import { describe, expect, it } from 'vitest'
import { en } from '../locales/en'
import { bn } from '../locales/bn'

type Tree = { [key: string]: string | Tree }

function flatten(tree: Tree, prefix = ''): Record<string, string> {
  return Object.entries(tree).reduce<Record<string, string>>((acc, [key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key
    return typeof value === 'string' ? { ...acc, [path]: value } : { ...acc, ...flatten(value, path) }
  }, {})
}

const flatEn = flatten(en)
const flatBn = flatten(bn)
const placeholders = (s: string) => [...s.matchAll(/{{\s*(\w+)\s*}}/g)].map((m) => m[1]).sort()

describe('translation files', () => {
  it('have exactly the same keys', () => {
    expect(Object.keys(flatBn).sort()).toEqual(Object.keys(flatEn).sort())
  })

  it('have no empty strings', () => {
    for (const [key, value] of [...Object.entries(flatEn), ...Object.entries(flatBn)]) {
      expect(value.trim(), key).not.toBe('')
    }
  })

  it('use the same {{placeholders}} in both languages', () => {
    for (const key of Object.keys(flatEn)) {
      expect(placeholders(flatBn[key]), key).toEqual(placeholders(flatEn[key]))
    }
  })

  it('actually translate user-facing text into Bangla', () => {
    // Brand names, codes and examples may stay identical; real sentences must not.
    const allowedSame = /appName|language\.|Placeholder$|enShort|bnShort/
    const untranslated = Object.keys(flatEn).filter(
      (key) => !allowedSame.test(key) && flatEn[key] === flatBn[key] && /[a-z]{3,} [a-z]{3,}/i.test(flatEn[key]),
    )
    expect(untranslated).toEqual([])
  })
})
