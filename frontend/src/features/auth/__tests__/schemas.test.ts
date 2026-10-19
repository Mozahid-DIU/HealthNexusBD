import { describe, expect, it } from 'vitest'
import type { ZodTypeAny } from 'zod'
import { i18n } from '@/i18n'
import { doctorSchema, forgotSchema, labSchema, loginSchema, patientSchema, resetSchema } from '../schemas'

const BAD = {
  identifier: '',
  password: '',
  fullName: '',
  nid: '12',
  email: 'nope',
  phone: '123',
  bmdcNumber: '',
  centerName: '',
  licenseNumber: '',
  code: 'abc',
  newPassword: 'x',
}

describe('auth form schemas', () => {
  it.each([
    ['login', loginSchema],
    ['patient', patientSchema],
    ['doctor', doctorSchema],
    ['lab', labSchema],
    ['forgot', forgotSchema],
    ['reset', resetSchema],
  ] as Array<[string, ZodTypeAny]>)('%s: every error message is a real translation key', (_name, schema) => {
    const result = schema.safeParse(BAD)
    expect(result.success).toBe(false)
    const messages = result.success ? [] : result.error.issues.map((i) => i.message)
    expect(messages.length).toBeGreaterThan(0)
    for (const message of messages) {
      expect(i18n.exists(message), message).toBe(true)
    }
  })

  it.each([
    ['patient', patientSchema],
    ['doctor', doctorSchema],
    ['lab', labSchema],
  ] as Array<[string, ZodTypeAny]>)('%s: over-long input also yields translation keys', (_name, schema) => {
    const long = 'x'.repeat(400)
    const result = schema.safeParse({
      fullName: long,
      bmdcNumber: long,
      specialization: long,
      centerName: long,
      licenseNumber: long,
      address: long,
      nid: '1990123456789',
      email: 'a@b.bd',
      phone: '01711111111',
      password: 'x'.repeat(100),
    })
    expect(result.success).toBe(false)
    for (const issue of result.success ? [] : result.error.issues) {
      expect(i18n.exists(issue.message), `${issue.path.join('.')}: ${issue.message}`).toBe(true)
    }
  })

  it('accepts valid patient input', () => {
    const ok = patientSchema.safeParse({
      fullName: 'Rahim Uddin',
      nid: '1990123456789',
      email: 'rahim@example.com',
      phone: '01711111111',
      password: 'Secret@123',
    })
    expect(ok.success).toBe(true)
  })
})
