import { beforeEach, describe, expect, it, vi } from 'vitest'
import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { routes } from '@/app/routes'
import { i18n } from '@/i18n'
import { renderRoutes } from '@/test/render'
import { envelope, mockApi } from '@/test/mockApi'
import { useAuthStore } from '@/stores/auth'
import type { AuthUser } from '@/types/api'
import type {
  AuditEntry,
  ConsentActivity,
  LabReport,
  MedicalRecordDetail,
  PatientNotification,
  PatientProfileDetail,
} from '../types'

const USER: AuthUser = {
  id: 'u-p',
  email: 'nasrin@hn.bd',
  phone: '01810000007',
  role: 'patient',
  status: 'active',
  patient: { id: 'p1', uhid: 'BD-2026-01240', fullName: 'Nasrin Akter', bloodGroup: 'A-' },
}

const META = (total: number) => ({ total, page: 1, limit: 10 })
const inMinutes = (m: number) => new Date(Date.now() + m * 60_000).toISOString()

const RECORD: MedicalRecordDetail = {
  id: 'r1',
  diagnosis: 'Type 1 Diabetes',
  content: 'Blood sugar stable. Continue insulin.',
  symptoms: ['fatigue', 'thirst'],
  followUpDate: '2026-12-01T00:00:00.000Z',
  createdAt: '2026-11-01T05:00:00Z',
  doctor: { fullName: 'Dr. Nusrat Jahan', specialization: 'Endocrinologist' },
  prescriptions: [
    {
      id: 'rx1',
      medications: [{ name: 'Insulin glargine', dose: '10 units', frequency: 'OD', duration: '90 days' }],
      recommendedTests: ['HbA1c'],
      notes: 'Check sugar twice daily',
      createdAt: '2026-11-01T05:10:00Z',
    },
  ],
  aiSummaries: [
    {
      id: 'ai1',
      summary: 'Working diagnosis: Type 1 Diabetes.',
      interactionAlerts: [],
      allergyAlerts: ['Documented allergy: Penicillin'],
      model: 'demo-rule-based',
      generatedAt: '2026-11-01T05:20:00Z',
    },
  ],
}

const REPORT: LabReport = {
  id: 'lr1',
  testName: 'HbA1c',
  fileUrl: '/api/patient/lab-reports/lr1/file',
  lab: 'PathCare Diagnostics',
  isVerified: true,
  uploadedAt: '2026-11-02T06:00:00Z',
}

const CONSENT: ConsentActivity = {
  pendingRequests: [
    {
      requestId: 'req1',
      doctor: { fullName: 'Dr. Ayesha Karim', specialization: 'Cardiologist', bmdcNumber: 'A-29871' },
      reason: 'Follow-up consultation',
      requestedAt: new Date().toISOString(),
      expiresAt: inMinutes(5),
    },
  ],
  activeSessions: [
    {
      sessionId: 's1',
      doctor: { fullName: 'Dr. Tanvir Ahmed', specialization: null, bmdcNumber: 'A-31245' },
      grantedAt: new Date().toISOString(),
      expiresAt: inMinutes(25),
    },
  ],
}

const NOTICE: PatientNotification = {
  id: 'n1',
  type: 'lab_report',
  title: 'New lab report available',
  body: 'stored english body',
  params: { testName: 'HbA1c', labName: 'PathCare Diagnostics' },
  readAt: null,
  createdAt: '2026-11-02T06:00:00Z',
}

const PROFILE: PatientProfileDetail = {
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
  chronicDiseases: [],
  createdAt: '2026-01-01T00:00:00Z',
}

const AUDIT: AuditEntry[] = [
  { id: 'a1', action: 'view', by: 'Dr. Tanvir Ahmed', role: 'doctor', resource: 'patient_records:3', at: '2026-11-03T06:00:00Z' },
  { id: 'a2', action: 'create', by: 'PathCare Diagnostics', role: 'lab', resource: 'lab_report:x', at: '2026-11-02T06:00:00Z' },
]

/** Every patient endpoint, with sensible defaults; tests override what they need. */
function backend(over: Record<string, Parameters<typeof mockApi>[0][string]> = {}) {
  return mockApi({
    'GET /auth/me': { body: envelope(USER) },
    'GET /consent/requests': { body: envelope(CONSENT) },
    'GET /patient/notifications': { body: envelope({ notifications: [NOTICE], unreadCount: 1 }, META(1)) },
    'GET /patient/lab-reports': { body: envelope([REPORT], META(1)) },
    'GET /patient/records': { body: envelope([RECORD], META(1)) },
    'GET /patient/records/r1': { body: envelope(RECORD) },
    'GET /patient/lab-reports/lr1/file': { blob: '%PDF-1.4 test' },
    'GET /patient/audit': { body: envelope(AUDIT, META(2)) },
    'GET /patient/profile': { body: envelope(PROFILE) },
    'POST /consent/requests/req1/deny': { body: envelope({ requestId: 'req1', status: 'denied' }) },
    'POST /consent/sessions/s1/revoke': { body: envelope({ sessionId: 's1', status: 'revoked' }) },
    'POST /patient/notifications/n1/read': { body: envelope({ id: 'n1', read: true }) },
    'POST /patient/notifications/read-all': { body: envelope({ updated: 1 }) },
    'PATCH /patient/profile': { body: envelope({}) },
    ...over,
  })
}

beforeEach(() => {
  vi.unstubAllGlobals()
  useAuthStore.getState().setAuth(USER, 'access', 'refresh')
})

describe('patient overview', () => {
  it('shows the ID card, live counts, a pending-consent alert and recent records', async () => {
    backend()
    renderRoutes(routes, '/patient')

    expect(await screen.findByText('BD-2026-01240')).toBeInTheDocument()
    expect(await screen.findByText('Pending access requests: 1')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Review' })).toHaveAttribute('href', '/patient/consent')
    expect(await screen.findByRole('link', { name: /Type 1 Diabetes/ })).toHaveAttribute('href', '/patient/records/r1')
    const unread = screen.getByRole('link', { name: /Unread notifications/ })
    expect(within(unread).getByText('1')).toBeInTheDocument()
  })

  it('shows the unread count on the bell', async () => {
    backend()
    renderRoutes(routes, '/patient')
    expect(await screen.findByRole('link', { name: 'Notifications, 1 unread' })).toBeInTheDocument()
  })

  it('caps the bell badge with Bangla digits', async () => {
    await i18n.changeLanguage('bn')
    backend({ 'GET /patient/notifications': { body: envelope({ notifications: [NOTICE], unreadCount: 150 }, META(150)) } })
    renderRoutes(routes, '/patient')
    const bell = await screen.findByRole('link', { name: /নোটিফিকেশন, ১৫০টি না-পড়া/ })
    expect(bell).toHaveTextContent('৯৯+')
  })
})

describe('medical records', () => {
  it('lists records and opens one with prescription, alerts and AI disclaimer', async () => {
    backend()
    const { router } = renderRoutes(routes, '/patient/records')

    await userEvent.click(await screen.findByRole('link', { name: /Type 1 Diabetes/ }))

    await waitFor(() => expect(router.state.location.pathname).toBe('/patient/records/r1'))
    expect(await screen.findByRole('heading', { level: 1, name: 'Type 1 Diabetes' })).toBeInTheDocument()
    expect(screen.getByText('Blood sugar stable. Continue insulin.')).toBeInTheDocument()
    const table = screen.getByRole('table')
    expect(within(table).getByText('Insulin glargine')).toBeInTheDocument()
    expect(screen.getByText('HbA1c')).toBeInTheDocument()
    expect(screen.getByText('Documented allergy: Penicillin')).toBeInTheDocument()
    expect(screen.getByText(/It is not a diagnosis/)).toBeInTheDocument()
    expect(screen.getByText('1 Dec 2026')).toBeInTheDocument() // follow-up, a calendar date
  })

  it('shows a clear message for a record that does not exist', async () => {
    backend({ 'GET /patient/records/missing': { status: 404, body: { success: false, data: null, error: 'Record not found' } } })
    renderRoutes(routes, '/patient/records/missing')
    expect(await screen.findByText('This record could not be found.')).toBeInTheDocument()
  })

  it('shows an empty state when there are no records', async () => {
    backend({ 'GET /patient/records': { body: envelope([], META(0)) } })
    renderRoutes(routes, '/patient/records')
    expect(await screen.findByText('No medical records yet')).toBeInTheDocument()
  })

  it('keeps the page number in the URL', async () => {
    const { calls } = backend({ 'GET /patient/records': { body: envelope([RECORD], { total: 25, page: 2, limit: 10 }) } })
    const { router } = renderRoutes(routes, '/patient/records?page=2')
    await screen.findByText('Page 2 of 3')
    expect(calls.some((c) => c.path === '/patient/records')).toBe(true)
    await userEvent.click(screen.getByRole('button', { name: 'Next' }))
    await waitFor(() => expect(router.state.location.search).toBe('?page=3'))
  })
})

describe('lab reports', () => {
  it('opens the decrypted PDF in a viewer', async () => {
    const { calls } = backend()
    renderRoutes(routes, '/patient/lab-reports')

    await userEvent.click(await screen.findByRole('button', { name: 'View: HbA1c' }))

    const dialog = await screen.findByRole('dialog', { name: 'HbA1c' })
    expect(within(dialog).getByTitle('HbA1c')).toHaveAttribute('src', 'blob:test')
    expect(calls.some((c) => c.path === '/patient/lab-reports/lr1/file')).toBe(true)
  })

  it('reports a failed download with a translated toast', async () => {
    backend({ 'GET /patient/lab-reports/lr1/file': { status: 404, body: { success: false, data: null, error: 'Lab report not found' } } })
    renderRoutes(routes, '/patient/lab-reports')

    await userEvent.click(await screen.findByRole('button', { name: 'Download: HbA1c' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Lab report not found')
  })
})

describe('consent center', () => {
  it('lists pending requests and active sessions with time left', async () => {
    backend()
    renderRoutes(routes, '/patient/consent')

    expect(await screen.findByText('Dr. Ayesha Karim')).toBeInTheDocument()
    expect(screen.getByText('Follow-up consultation')).toBeInTheDocument()
    expect(screen.getByText('Dr. Tanvir Ahmed')).toBeInTheDocument()
    expect(screen.getByText(/2[45] min left/)).toBeInTheDocument()
  })

  it('denies a request after confirmation', async () => {
    const { calls } = backend()
    renderRoutes(routes, '/patient/consent')

    await userEvent.click(await screen.findByRole('button', { name: 'Deny: Dr. Ayesha Karim' }))
    const dialog = screen.getByRole('dialog', { name: 'Deny this request?' })
    expect(dialog).toHaveTextContent('Dr. Ayesha Karim')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Deny' }))

    await waitFor(() => expect(calls.some((c) => c.method === 'POST' && c.path === '/consent/requests/req1/deny')).toBe(true))
    expect(await screen.findByText('Request denied')).toBeInTheDocument()
  })

  it('revokes a session, but not if the user cancels', async () => {
    const { calls } = backend()
    renderRoutes(routes, '/patient/consent')

    await userEvent.click(await screen.findByRole('button', { name: 'Revoke access: Dr. Tanvir Ahmed' }))
    await userEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Cancel' }))
    expect(calls.some((c) => c.path.endsWith('/revoke'))).toBe(false)

    await userEvent.click(screen.getByRole('button', { name: 'Revoke access: Dr. Tanvir Ahmed' }))
    await userEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Revoke access' }))
    await waitFor(() => expect(calls.some((c) => c.path === '/consent/sessions/s1/revoke')).toBe(true))
  })

  it('shows a session in its last minute as ending, and keeps it revocable', async () => {
    backend({
      'GET /consent/requests': {
        body: envelope({ pendingRequests: [], activeSessions: [{ ...CONSENT.activeSessions[0], expiresAt: inMinutes(0.5) }] }),
      },
    })
    renderRoutes(routes, '/patient/consent')
    expect(await screen.findByText('Ending now')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Revoke access: Dr. Tanvir Ahmed' })).toBeEnabled()
  })

  it('keeps the dialog open until the list has refreshed, so a row cannot be handled twice', async () => {
    let consentCalls = 0
    let releaseRefetch!: () => void
    backend({
      'GET /consent/requests': () => {
        consentCalls += 1
        return { body: envelope(consentCalls === 1 ? CONSENT : { pendingRequests: [], activeSessions: CONSENT.activeSessions }) }
      },
    })
    const original = globalThis.fetch
    vi.stubGlobal('fetch', async (input: RequestInfo | URL, init?: RequestInit) => {
      if (String(input).endsWith('/consent/requests') && consentCalls >= 1) {
        await new Promise<void>((r) => (releaseRefetch = r))
      }
      return original(input, init)
    })
    renderRoutes(routes, '/patient/consent')

    await userEvent.click(await screen.findByRole('button', { name: 'Deny: Dr. Ayesha Karim' }))
    await userEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Deny' }))
    await screen.findByText('Request denied')
    expect(screen.getByRole('dialog')).toBeInTheDocument() // still refreshing

    releaseRefetch()
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(screen.queryByRole('button', { name: 'Deny: Dr. Ayesha Karim' })).not.toBeInTheDocument()
  })
})

describe('pagination edge', () => {
  it('jumps back to the last page when the URL points past the end', async () => {
    backend({ 'GET /patient/records': { body: envelope([], { total: 12, page: 9, limit: 10 }) } })
    const { router } = renderRoutes(routes, '/patient/records?page=9')
    await waitFor(() => expect(router.state.location.search).toBe('?page=2'))
  })
})

describe('notifications', () => {
  it('renders the message from params in the active language, and marks it read', async () => {
    const { calls } = backend()
    renderRoutes(routes, '/patient/notifications')

    expect(await screen.findByText('Your HbA1c report from PathCare Diagnostics is ready to view.')).toBeInTheDocument()
    expect(screen.queryByText('stored english body')).not.toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: /^Mark as read: / }))
    await waitFor(() => expect(calls.some((c) => c.path === '/patient/notifications/n1/read')).toBe(true))

    await userEvent.click(screen.getByRole('button', { name: 'Mark all as read' }))
    await waitFor(() => expect(calls.some((c) => c.path === '/patient/notifications/read-all')).toBe(true))
  })
})

describe('audit', () => {
  it('describes each access in plain language', async () => {
    backend()
    renderRoutes(routes, '/patient/audit')
    expect(await screen.findByText('Viewed your medical records')).toBeInTheDocument()
    expect(screen.getByText('Uploaded a lab report')).toBeInTheDocument()
    expect(screen.getByText('PathCare Diagnostics')).toBeInTheDocument()
  })
})

describe('profile', () => {
  it('saves only what changed and refreshes the stored user', async () => {
    const { calls } = backend()
    renderRoutes(routes, '/patient/profile')

    const save = await screen.findByRole('button', { name: 'Save changes' })
    expect(save).toBeDisabled() // nothing changed yet
    await userEvent.selectOptions(screen.getByLabelText('Blood group'), 'O+')
    await userEvent.clear(screen.getByLabelText('Allergies'))
    await userEvent.type(screen.getByLabelText('Allergies'), 'Penicillin, Dust')
    await userEvent.click(save)

    await waitFor(() => expect(calls.some((c) => c.method === 'PATCH')).toBe(true))
    expect(calls.find((c) => c.method === 'PATCH')!.body).toEqual({ bloodGroup: 'O+', allergies: ['Penicillin', 'Dust'] })
    expect(await screen.findByText('Profile updated')).toBeInTheDocument()
    await waitFor(() => expect(calls.filter((c) => c.path === '/auth/me').length).toBeGreaterThan(0))
  })

  it('blocks a future date of birth', async () => {
    const { calls } = backend()
    renderRoutes(routes, '/patient/profile')

    const dob = await screen.findByLabelText('Date of birth')
    await userEvent.clear(dob)
    await userEvent.type(dob, '2999-01-01')
    await userEvent.click(screen.getByRole('button', { name: 'Save changes' }))

    expect(await screen.findByText('Date of birth cannot be in the future')).toBeInTheDocument()
    expect(calls.some((c) => c.method === 'PATCH')).toBe(false)
  })
})

describe('patient pages in Bangla', () => {
  const ENGLISH = /Medical records|Lab reports|Consent center|Pending requests|Mark all as read|Who accessed my data|Save changes|Viewed your|Your HbA1c report/

  it.each([
    '/patient',
    '/patient/records',
    '/patient/records/r1',
    '/patient/lab-reports',
    '/patient/consent',
    '/patient/notifications',
    '/patient/audit',
    '/patient/profile',
  ])('%s has no untranslated UI text', async (path) => {
    await i18n.changeLanguage('bn')
    backend()
    renderRoutes(routes, path)
    await screen.findByRole('heading', { level: 1 })
    await waitFor(() => expect(screen.queryAllByRole('status', { name: 'কনটেন্ট লোড হচ্ছে' })).toHaveLength(0))
    expect(document.body.textContent).not.toMatch(ENGLISH)
  })
})
