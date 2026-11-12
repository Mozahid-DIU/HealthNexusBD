import { describe, expect, it } from 'vitest'
import { i18n } from '@/i18n'
import { describeAudit } from '../auditText'
import type { AuditRow } from '../types'

const row = (action: AuditRow['action'], resource: string | null): AuditRow => ({
  id: 'a1',
  action,
  resource,
  ipAddress: null,
  createdAt: '2026-11-12T10:00:00Z',
  actor: { email: 'x@hn.bd', role: 'doctor' },
  patient: null,
})

describe('describeAudit', () => {
  const t = i18n.getFixedT('en')

  it.each([
    ['view', 'patient_records:3', 'Viewed medical records'],
    ['view', 'patient_search:p1', 'Searched for a patient'],
    ['create', 'lab_report:r1', 'Uploaded a lab report'],
    ['grant', 'session:s1', 'Was granted access by the patient'],
    ['update', 'doctor_approved:d1', 'Approved a doctor'],
    ['update', 'user_suspended:u1', 'Suspended an account'],
    ['login', null, 'Signed in'],
  ] as const)('%s %s → %s', (action, resource, text) => {
    expect(describeAudit(row(action, resource), t).text).toBe(text)
  })

  it('pulls out the reason an admin gave for a rejection', () => {
    const result = describeAudit(row('update', 'lab_rejected:9b2c (Licence expired in 2025)'), t)
    expect(result).toEqual({ text: 'Rejected a lab', reason: 'Licence expired in 2025' })
  })

  it('never shows a raw resource string for something unknown', () => {
    expect(describeAudit(row('update', 'something_new:42'), t)).toEqual({ text: 'Other activity', reason: null })
  })
})
