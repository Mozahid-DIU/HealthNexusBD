import { describe, expect, it } from 'vitest'
import { i18n } from '@/i18n'
import { auditDescription, minutesLeft, notificationText } from '../text'
import type { AuditEntry, PatientNotification } from '../types'

const notice = (over: Partial<PatientNotification>): PatientNotification => ({
  id: 'n1',
  type: 'lab_report',
  title: 'New lab report available',
  body: 'Your CBC report from PathCare is ready to view.',
  params: {},
  readAt: null,
  createdAt: '2026-11-10T03:00:00Z',
  ...over,
})

const entry = (action: AuditEntry['action'], resource: string | null): AuditEntry => ({
  id: 'a',
  action,
  by: 'Dr. X',
  role: 'doctor',
  resource,
  at: '2026-11-10T03:00:00Z',
})

describe('notificationText', () => {
  it('renders lab report notices from params, in the active language', async () => {
    const n = notice({ params: { testName: 'CBC', labName: 'PathCare' } })
    expect(notificationText(n, i18n.t, 'en')).toEqual({
      title: 'New lab report available',
      body: 'Your CBC report from PathCare is ready to view.',
    })
    await i18n.changeLanguage('bn')
    expect(notificationText(n, i18n.t, 'bn').body).toBe('PathCare থেকে আপনার CBC রিপোর্ট দেখার জন্য প্রস্তুত।')
  })

  it('formats the follow-up date (a calendar day) and includes the diagnosis when present', () => {
    const withDx = notice({ type: 'follow_up', params: { date: '2026-03-11', diagnosis: 'Hypertension' } })
    const noDx = notice({ type: 'follow_up', params: { date: '2026-03-11' } })
    expect(notificationText(withDx, i18n.t, 'en').body).toBe(
      'Reminder: your follow-up visit for Hypertension is on 11 Mar 2026.',
    )
    expect(notificationText(noDx, i18n.t, 'en').body).toBe('Reminder: your follow-up visit is on 11 Mar 2026.')
  })

  it('falls back to the stored text for older notices without params', () => {
    const n = notice({ params: {}, title: 'Stored title', body: 'Stored body' })
    expect(notificationText(n, i18n.t, 'en')).toEqual({ title: 'Stored title', body: 'Stored body' })
  })
})

describe('auditDescription', () => {
  it.each([
    ['view', 'patient_records:3', 'Viewed your medical records'],
    ['view', 'patient_profile:abc', 'Viewed your health profile'],
    ['view', 'lab_reports:2', 'Viewed your lab report list'],
    ['view', 'lab_report_file:abc', 'Opened a lab report'],
    ['view', 'patient_search:abc', 'Looked you up by UHID or phone number'],
    ['create', 'medical_record:abc', 'Added a medical record'],
    ['create', 'prescription:abc', 'Wrote a prescription'],
    ['create', 'ai_summary:abc', 'Generated an AI clinical summary'],
    ['create', 'lab_report:abc', 'Uploaded a lab report'],
    ['create', 'consent_request:abc', 'Requested access to your records'],
    ['grant', 'session:abc', 'Was granted access with your code'],
    ['revoke', 'session:abc', 'Access was revoked'],
    ['revoke', 'consent_request:abc', 'An access request was denied'],
    ['view', null, 'Viewed your data'],
    ['update', 'something_new:1', 'Updated your records'],
  ] as const)('%s %s → %s', (action, resource, text) => {
    expect(auditDescription(entry(action, resource), i18n.t)).toBe(text)
  })
})

describe('minutesLeft', () => {
  const now = new Date('2026-11-10T10:00:00Z').getTime()
  it('rounds up remaining minutes and never goes negative', () => {
    expect(minutesLeft('2026-11-10T10:29:01Z', now)).toBe(30)
    expect(minutesLeft('2026-11-10T10:00:30Z', now)).toBe(1)
    expect(minutesLeft('2026-11-10T09:59:00Z', now)).toBe(0)
    expect(minutesLeft('garbage', now)).toBe(0)
  })
})
