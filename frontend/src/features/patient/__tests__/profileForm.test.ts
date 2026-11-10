import { describe, expect, it } from 'vitest'
import { i18n } from '@/i18n'
import { changedFields, parseList, profileSchema, toFormValues } from '../profileForm'
import type { PatientProfileDetail } from '../types'

const profile: PatientProfileDetail = {
  id: 'p1',
  uhid: 'BD-2026-01240',
  nid: '1990123456787',
  fullName: 'Nasrin Akter',
  email: 'nasrin@hn.bd',
  phone: '01810000007',
  dateOfBirth: '2000-03-14T00:00:00.000Z',
  gender: 'female',
  bloodGroup: 'A-',
  allergies: ['Penicillin'],
  chronicDiseases: ['Type 1 Diabetes'],
  createdAt: '2026-01-01T00:00:00Z',
}

describe('profile form', () => {
  it('parses comma lists: trims, drops blanks and case-insensitive duplicates', () => {
    expect(parseList(' Penicillin, peanuts ,, penicillin\nDust ')).toEqual(['Penicillin', 'peanuts', 'Dust'])
    expect(parseList('')).toEqual([])
  })

  it('loads the saved profile into the form', () => {
    expect(toFormValues(profile)).toEqual({
      fullName: 'Nasrin Akter',
      dateOfBirth: '2000-03-14',
      gender: 'female',
      bloodGroup: 'A-',
      allergies: 'Penicillin',
      chronicDiseases: 'Type 1 Diabetes',
    })
  })

  it('sends nothing when nothing changed', () => {
    expect(changedFields(profile, toFormValues(profile))).toEqual({})
  })

  it('sends only the fields that changed', () => {
    const v = { ...toFormValues(profile), bloodGroup: 'O+' as const, allergies: 'Penicillin, Dust' }
    expect(changedFields(profile, v)).toEqual({ bloodGroup: 'O+', allergies: ['Penicillin', 'Dust'] })
  })

  it('can clear a list but never sends a blank select or date', () => {
    const v = { ...toFormValues(profile), allergies: '', gender: '' as const, dateOfBirth: '' }
    expect(changedFields(profile, v)).toEqual({ allergies: [] })
  })

  it('rejects a future date of birth and over-long items, with translation keys', () => {
    const bad = profileSchema.safeParse({
      ...toFormValues(profile),
      dateOfBirth: '2999-01-01',
      allergies: 'x'.repeat(61),
      fullName: 'A',
    })
    expect(bad.success).toBe(false)
    for (const issue of bad.success ? [] : bad.error.issues) {
      expect(i18n.exists(issue.message), issue.message).toBe(true)
    }
  })
})
