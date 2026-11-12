import { describe, expect, it } from 'vitest'
import { namesMatch } from '../verification'

describe('namesMatch', () => {
  it('ignores case, spacing, punctuation and the "Dr." title', () => {
    expect(namesMatch('Dr. Ayesha Karim', 'ayesha  karim')).toBe(true)
    expect(namesMatch('PathCare Diagnostics', 'Pathcare diagnostics.')).toBe(true)
  })

  it('flags a different name', () => {
    expect(namesMatch('Dr. Ayesha Karim', 'Dr. Ayesha Rahman')).toBe(false)
  })
})
