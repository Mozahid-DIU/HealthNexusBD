import { describe, expect, it } from 'vitest'
import { i18n } from '@/i18n'
import { emptyMedication, toPayloads, visitSchema, type VisitValues } from '../visitForm'

const base: VisitValues = {
  diagnosis: 'Pneumonia',
  content: 'Fever for 3 days, crackles on the right.',
  symptoms: ['fever'],
  followUpDate: '',
  medications: [emptyMedication()],
  recommendedTests: [],
  notes: '',
}

describe('visit form', () => {
  it('ignores blank medicine rows and sends no prescription when nothing is prescribed', () => {
    expect(visitSchema.safeParse(base).success).toBe(true)
    const { record, prescription } = toPayloads('p1', base)
    expect(record).toEqual({ patientId: 'p1', diagnosis: 'Pneumonia', content: base.content, symptoms: ['fever'] })
    expect(prescription).toBeNull()
  })

  it('builds a prescription from filled rows and tests, trimming and omitting empty duration', () => {
    const v = {
      ...base,
      followUpDate: '2999-01-01',
      medications: [{ name: ' Amoxicillin ', dose: '500 mg', frequency: 'TDS', duration: '' }, emptyMedication()],
      recommendedTests: ['CBC'],
      notes: ' Rest ',
    }
    const { record, prescription } = toPayloads('p1', v)
    expect(record.followUpDate).toBe('2999-01-01')
    expect(prescription).toEqual({
      medications: [{ name: 'Amoxicillin', dose: '500 mg', frequency: 'TDS' }],
      recommendedTests: ['CBC'],
      notes: 'Rest',
    })
  })

  it('sends a tests-only prescription', () => {
    const { prescription } = toPayloads('p1', { ...base, recommendedTests: ['HbA1c'] })
    expect(prescription).toEqual({ medications: [], recommendedTests: ['HbA1c'] })
  })

  it('refuses advice that would be dropped because nothing is prescribed', () => {
    const bad = visitSchema.safeParse({ ...base, notes: 'Drink water' })
    expect(bad.success).toBe(false)
    expect(bad.success ? [] : bad.error.issues.map((i) => i.message)).toContain('doctor.visit.notesNeedRx')
  })

  it('flags half-filled medicine rows and past follow-up dates with translation keys', () => {
    const bad = visitSchema.safeParse({
      ...base,
      diagnosis: 'x',
      followUpDate: '2000-01-01',
      medications: [{ name: 'Paracetamol', dose: '', frequency: '', duration: '' }],
    })
    expect(bad.success).toBe(false)
    const messages = bad.success ? [] : bad.error.issues.map((i) => i.message)
    expect(messages).toEqual(expect.arrayContaining(['doctor.visit.medIncomplete', 'doctor.visit.futureOnly']))
    for (const m of messages) expect(i18n.exists(m), m).toBe(true)
  })
})
