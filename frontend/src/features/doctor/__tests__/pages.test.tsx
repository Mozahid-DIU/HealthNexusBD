import { beforeEach, describe, expect, it, vi } from 'vitest'
import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { routes } from '@/app/routes'
import { i18n } from '@/i18n'
import { renderRoutes } from '@/test/render'
import { envelope, mockApi } from '@/test/mockApi'
import { useAuthStore } from '@/stores/auth'
import type { AuthUser } from '@/types/api'
import type { AccessRequest, ChartRecord, ClinicalProfile, ConsentedPatient, SearchResult } from '../types'

const DOCTOR: AuthUser = {
  id: 'u-d',
  email: 'ayesha.karim@hn.bd',
  phone: '01710000001',
  role: 'doctor',
  status: 'active',
  doctor: { id: 'd1', bmdcNumber: 'A-29871', fullName: 'Dr. Ayesha Karim' },
}

const inMinutes = (m: number) => new Date(Date.now() + m * 60_000).toISOString()
const META = (total: number) => ({ total, page: 1, limit: 10 })

const SEARCH: SearchResult = {
  patientId: 'p1',
  uhid: 'BD-2026-01240',
  fullName: 'Nasrin Akter',
  gender: 'female',
  phone: '********007',
  hasActiveConsent: false,
  consentExpiresAt: null,
}

const REQUEST: AccessRequest = {
  requestId: '11111111-1111-1111-1111-111111111111',
  patient: { uhid: 'BD-2026-01240', fullName: 'Nasrin Akter' },
  reason: 'Chest pain',
  expiresAt: inMinutes(5),
  otpMode: 'demo',
  smsSent: false,
  devOtp: '482913',
}

const PROFILE: ClinicalProfile = {
  id: 'p1',
  uhid: 'BD-2026-01240',
  fullName: 'Nasrin Akter',
  dateOfBirth: '2000-03-14T00:00:00.000Z',
  gender: 'female',
  bloodGroup: 'A-',
  allergies: ['Penicillin'],
  chronicDiseases: ['Type 1 Diabetes'],
  consentExpiresAt: inMinutes(25),
}

const RECORD: ChartRecord = {
  id: 'r1',
  diagnosis: 'Type 1 Diabetes Mellitus',
  content: 'Stable on insulin.',
  symptoms: ['polydipsia'],
  isVerified: true,
  followUpDate: null,
  createdAt: '2026-10-19T05:00:00Z',
  author: { fullName: 'Dr. Nusrat Jahan', specialization: 'Endocrinologist' },
  prescriptions: [
    { id: 'rx1', medications: [{ name: 'Insulin Glargine', dose: '18 units', frequency: 'Nocte' }], recommendedTests: ['HbA1c'], notes: null, createdAt: '2026-10-19T05:05:00Z' },
  ],
  aiSummaries: [],
}

const ACTIVE: ConsentedPatient[] = [
  { id: 'p1', uhid: 'BD-2026-01240', fullName: 'Nasrin Akter', gender: 'female', bloodGroup: 'A-', consentExpiresAt: inMinutes(25) },
]

function backend(over: Record<string, Parameters<typeof mockApi>[0][string]> = {}) {
  return mockApi({
    'GET /auth/me': { body: envelope(DOCTOR) },
    'GET /doctor/patients': { body: envelope(ACTIVE) },
    'GET /doctor/search': { body: envelope(SEARCH) },
    'POST /consent/request': { status: 201, body: envelope(REQUEST) },
    'POST /consent/verify': ({ body }) =>
      (body as { code: string }).code === '482913'
        ? { status: 201, body: envelope({ sessionId: 's1', patient: REQUEST.patient, expiresAt: inMinutes(30) }) }
        : { status: 400, body: { success: false, data: null, error: 'Invalid code. 4 attempt(s) remaining.' } },
    'GET /doctor/patients/p1': { body: envelope(PROFILE) },
    'GET /doctor/patients/p1/records': { body: envelope([RECORD], META(1)) },
    'GET /doctor/patients/p1/lab-reports': { body: envelope([], META(0)) },
    'POST /doctor/records': { status: 201, body: envelope({ id: 'r-new', diagnosis: 'Pneumonia', createdAt: new Date().toISOString() }) },
    'POST /doctor/records/r-new/prescription': { status: 201, body: envelope({ id: 'rx-new', recordId: 'r-new', createdAt: '' }) },
    'POST /doctor/records/r-new/ai-summary': {
      status: 201,
      body: envelope({
        id: 'ai1',
        summary: 'Working diagnosis: Pneumonia.',
        interactionAlerts: [],
        allergyAlerts: ['⚠ Amoxicillin may cross-react with a documented Penicillin allergy.'],
        model: 'demo-rule-based',
        generatedAt: new Date().toISOString(),
      }),
    },
    ...over,
  })
}

beforeEach(() => {
  vi.unstubAllGlobals()
  useAuthStore.getState().setAuth(DOCTOR, 'access', 'refresh')
})

describe('verification gate', () => {
  it('shows the pending screen, then unlocks once the admin approves', async () => {
    useAuthStore.getState().setAuth({ ...DOCTOR, status: 'pending' }, 'access', 'refresh')
    let approved = false
    backend({ 'GET /auth/me': () => ({ body: envelope({ ...DOCTOR, status: approved ? 'active' : 'pending' }) }) })
    renderRoutes(routes, '/doctor')

    expect(await screen.findByRole('heading', { name: 'Your account is being verified' })).toBeInTheDocument()
    expect(screen.getByText('A-29871')).toBeInTheDocument()

    approved = true
    await userEvent.click(screen.getByRole('button', { name: 'Check again' }))
    expect(await screen.findByRole('heading', { name: 'Good to see you, Dr. Ayesha Karim' })).toBeInTheDocument()
  })
})

describe('home and search', () => {
  it('lists patients with live access and hands a search to the find page', async () => {
    backend()
    const { router } = renderRoutes(routes, '/doctor')

    expect(await screen.findByRole('link', { name: 'Open chart: Nasrin Akter' })).toHaveAttribute('href', '/doctor/patients/p1')
    await userEvent.type(screen.getByLabelText('UHID or mobile number'), 'bd-2026-01240')
    await userEvent.click(screen.getByRole('button', { name: 'Find patient' }))

    await waitFor(() => expect(router.state.location.pathname).toBe('/doctor/find'))
    // The find page's own result section (the home list also names her while it loads).
    expect(await screen.findByRole('region', { name: 'Nasrin Akter' })).toBeInTheDocument()
  })

  it('validates the search term before sending anything', async () => {
    const { calls } = backend()
    renderRoutes(routes, '/doctor/find')

    await userEvent.type(await screen.findByLabelText('UHID or mobile number'), '12345')
    await userEvent.click(screen.getByRole('button', { name: 'Find patient' }))

    expect(screen.getByText(/Enter a UHID/)).toBeInTheDocument()
    expect(calls.some((c) => c.path === '/doctor/search')).toBe(false)
  })

  it('searches by mobile number in any common format', async () => {
    const { calls } = backend()
    const { router } = renderRoutes(routes, '/doctor/find?q=%2B880%201810-000007')
    await screen.findByText('Nasrin Akter')
    expect(calls.find((c) => c.path === '/doctor/search')).toBeTruthy()
    // The phone number does not stay in the address bar or history: the UHID replaces it.
    await waitFor(() => expect(router.state.location.search).toBe('?q=BD-2026-01240'))
    expect(router.state.historyAction).toBe('REPLACE')
  })

  it('says so when nobody matches', async () => {
    backend({ 'GET /doctor/search': { status: 404, body: { success: false, data: null, error: 'No patient found' } } })
    renderRoutes(routes, '/doctor/find?q=BD-2026-99999')
    expect(await screen.findByText('No patient found with this UHID or number.')).toBeInTheDocument()
  })

  it('offers the chart directly when access is already active', async () => {
    backend({ 'GET /doctor/search': { body: envelope({ ...SEARCH, hasActiveConsent: true, consentExpiresAt: inMinutes(20) }) } })
    renderRoutes(routes, '/doctor/find?q=BD-2026-01240')
    expect(await screen.findByRole('link', { name: 'Open chart' })).toHaveAttribute('href', '/doctor/patients/p1')
  })
})

describe('consent flow', () => {
  it('sends a code with the reason, rejects a wrong code, then opens the chart', async () => {
    const { calls } = backend()
    const { router } = renderRoutes(routes, '/doctor/find?q=BD-2026-01240')

    await userEvent.type(await screen.findByLabelText('Reason for access (shown to the patient)'), 'Chest pain')
    await userEvent.click(screen.getByRole('button', { name: 'Send consent code' }))
    expect(calls.find((c) => c.path === '/consent/request')!.body).toEqual({ uhid: 'BD-2026-01240', reason: 'Chest pain' })

    expect(await screen.findByText(/The code is 482913/)).toBeInTheDocument()
    await userEvent.click(screen.getByLabelText('6-digit consent code 1'))
    await userEvent.keyboard('000000')
    expect(await screen.findByText('That code is not correct. 4 attempt(s) left.')).toBeInTheDocument()
    expect(screen.getByLabelText('6-digit consent code 1')).toHaveValue('')
    // Ready to type again without reaching for the mouse.
    await waitFor(() => expect(screen.getByLabelText('6-digit consent code 1')).toHaveFocus())
    // Every step is named for screen readers, and finished steps say so.
    const steps = screen.getByRole('list', { name: 'Find a patient' })
    expect(within(steps).getByText('Find')).toBeInTheDocument()
    expect(within(steps).getByText('Consent code')).toBeInTheDocument()
    expect(within(steps).getByText('(completed)')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Use code' }))
    await waitFor(() => expect(router.state.location.pathname).toBe('/doctor/patients/p1'))
    expect(await screen.findByText('Access granted for 30 minutes')).toBeInTheDocument()
  })
})

describe('consent flow edge cases', () => {
  it('shows why a new code could not be sent', async () => {
    let sent = 0
    backend({
      'POST /consent/request': () => {
        sent += 1
        return sent === 1
          ? { status: 201, body: envelope(REQUEST) }
          : { status: 429, body: { success: false, data: null, error: 'Too many attempts' } }
      },
    })
    renderRoutes(routes, '/doctor/find?q=BD-2026-01240')
    await userEvent.click(await screen.findByRole('button', { name: 'Send consent code' }))
    await userEvent.click(await screen.findByRole('button', { name: 'Send a new code' }))

    expect(await screen.findByText('Too many attempts. Please wait a few minutes and try again.')).toBeInTheDocument()
    expect(sent).toBe(2)
  })

  it('opens the chart straight away after access is granted again', async () => {
    let granted = false
    let release = () => {}
    const fresh = new Promise<void>((resolve) => (release = resolve))
    backend({
      // The chart was open when the session ran out, so its last profile is still cached.
      // After the new grant the server is slow, which is when a stale screen would show.
      'GET /doctor/patients/p1': async () => {
        if (!granted) return { body: envelope({ ...PROFILE, consentExpiresAt: inMinutes(-1) }) }
        await fresh
        return { body: envelope({ ...PROFILE, consentExpiresAt: inMinutes(30) }) }
      },
      'POST /consent/verify': () => {
        granted = true
        return { status: 201, body: envelope({ sessionId: 's2', patient: REQUEST.patient, expiresAt: inMinutes(30) }) }
      },
    })
    const { router } = renderRoutes(routes, '/doctor/patients/p1')
    await screen.findByRole('heading', { name: 'Your access has ended' })

    await router.navigate('/doctor/find?q=BD-2026-01240')
    await userEvent.click(await screen.findByRole('button', { name: 'Send consent code' }))
    await userEvent.click(await screen.findByRole('button', { name: 'Use code' }))
    await waitFor(() => expect(router.state.location.pathname).toBe('/doctor/patients/p1'))
    await within(document.querySelector('main')!).findByRole('link', { name: 'My patients' })

    // No stale "access ended" screen from before the new grant while the chart loads.
    expect(screen.queryByRole('heading', { name: 'Your access has ended' })).not.toBeInTheDocument()
    release()
    expect(await screen.findByRole('heading', { level: 1, name: 'Nasrin Akter' })).toBeInTheDocument()
  })
})

describe('patient chart', () => {
  it('puts allergies, age and blood group up front', async () => {
    backend()
    renderRoutes(routes, '/doctor/patients/p1')

    expect(await screen.findByRole('heading', { level: 1, name: 'Nasrin Akter' })).toBeInTheDocument()
    expect(screen.getByText('Penicillin')).toBeInTheDocument()
    expect(screen.getByText('Type 1 Diabetes')).toBeInTheDocument()
    expect(screen.getByText('A-')).toBeInTheDocument()
    expect(screen.getByText(/2[45] min left/)).toBeInTheDocument()
  })

  it('expands a record to show its prescription', async () => {
    backend()
    renderRoutes(routes, '/doctor/patients/p1')

    await userEvent.click(await screen.findByRole('button', { name: /Type 1 Diabetes Mellitus/ }))
    expect(screen.getByText('Insulin Glargine')).toBeInTheDocument()
    expect(screen.getByText('HbA1c')).toBeInTheDocument()
  })

  it('locks itself and offers a new request when consent has ended', async () => {
    backend({
      'GET /doctor/patients/p1': {
        status: 403,
        body: { success: false, data: null, error: 'no consent', code: 'CONSENT_REQUIRED' },
      },
    })
    renderRoutes(routes, '/doctor/patients/p1')
    expect(await screen.findByRole('heading', { name: 'Your access has ended' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Request access again' })).toHaveAttribute('href', '/doctor/find')
  })
})

describe('new visit', () => {
  async function fillVisit() {
    await userEvent.type(await screen.findByLabelText('Diagnosis'), 'Pneumonia')
    await userEvent.type(screen.getByLabelText('Symptoms'), 'fever{Enter}')
    await userEvent.type(screen.getByLabelText('Clinical note'), 'Crackles on the right.')
    await userEvent.type(screen.getByLabelText('Medicine'), 'Amoxicillin')
    await userEvent.type(screen.getByLabelText('Dose'), '500 mg')
    await userEvent.type(screen.getByLabelText('Frequency'), 'TDS')
    await userEvent.type(screen.getByLabelText('Recommended tests'), 'CBC{Enter}')
  }

  it('reminds of allergies, saves record + prescription, then runs the AI check', async () => {
    const { calls } = backend()
    renderRoutes(routes, '/doctor/patients/p1?tab=visit')

    expect(await screen.findByText('Allergies: Penicillin')).toBeInTheDocument()
    await fillVisit()
    await userEvent.click(screen.getByRole('button', { name: 'Save visit' }))

    expect(await screen.findByText('Visit saved')).toBeInTheDocument()
    expect(calls.find((c) => c.path === '/doctor/records')!.body).toEqual({
      patientId: 'p1',
      diagnosis: 'Pneumonia',
      content: 'Crackles on the right.',
      symptoms: ['fever'],
    })
    expect(calls.find((c) => c.path === '/doctor/records/r-new/prescription')!.body).toEqual({
      medications: [{ name: 'Amoxicillin', dose: '500 mg', frequency: 'TDS' }],
      recommendedTests: ['CBC'],
    })

    await userEvent.click(screen.getByRole('button', { name: 'Generate AI summary' }))
    expect(await screen.findByText(/Amoxicillin may cross-react/)).toBeInTheDocument()
  })

  it('retries only the prescription if it failed, never duplicating the visit', async () => {
    let rxAttempts = 0
    const { calls } = backend({
      'POST /doctor/records/r-new/prescription': () => {
        rxAttempts += 1
        return rxAttempts === 1
          ? { status: 500, body: { success: false, data: null, error: 'Internal server error' } }
          : { status: 201, body: envelope({ id: 'rx-new', recordId: 'r-new', createdAt: '' }) }
      },
    })
    renderRoutes(routes, '/doctor/patients/p1?tab=visit')
    await fillVisit()
    await userEvent.click(screen.getByRole('button', { name: 'Save visit' }))

    await userEvent.click(await screen.findByRole('button', { name: 'Save prescription again' }))
    await waitFor(() => expect(screen.queryByRole('button', { name: 'Save prescription again' })).not.toBeInTheDocument())
    expect(calls.filter((c) => c.method === 'POST' && c.path === '/doctor/records')).toHaveLength(1)
    expect(rxAttempts).toBe(2)
  })

  it('keeps the draft when the doctor glances at another tab', async () => {
    backend()
    renderRoutes(routes, '/doctor/patients/p1?tab=visit')
    await userEvent.type(await screen.findByLabelText('Diagnosis'), 'Pneumonia')

    await userEvent.click(screen.getByRole('tab', { name: 'Records' }))
    await screen.findByRole('button', { name: /Type 1 Diabetes Mellitus/ })
    await userEvent.click(screen.getByRole('tab', { name: 'New visit' }))

    expect(screen.getByLabelText('Diagnosis')).toHaveValue('Pneumonia')
  })

  it('keeps the chart and the draft through a failed background refresh', async () => {
    let offline = false
    backend({
      'GET /doctor/patients/p1': () =>
        offline ? { status: 503, body: { success: false, data: null, error: 'down' } } : { body: envelope(PROFILE) },
    })
    const { client } = renderRoutes(routes, '/doctor/patients/p1?tab=visit')
    await userEvent.type(await screen.findByLabelText('Diagnosis'), 'Pneumonia')

    offline = true
    await client.refetchQueries({ queryKey: ['doctor', 'patient', 'p1', 'profile'] })

    expect(await screen.findByText(/Connection problem/)).toBeInTheDocument()
    expect(screen.getByLabelText('Diagnosis')).toHaveValue('Pneumonia')
  })

  it('locks the chart if consent ends between saving the visit and the prescription', async () => {
    let consent = true
    backend({
      'GET /doctor/patients/p1': () =>
        consent
          ? { body: envelope(PROFILE) }
          : { status: 403, body: { success: false, data: null, error: 'no consent', code: 'CONSENT_REQUIRED' } },
      'POST /doctor/records/r-new/prescription': () => {
        consent = false
        return { status: 403, body: { success: false, data: null, error: 'no consent', code: 'CONSENT_REQUIRED' } }
      },
    })
    renderRoutes(routes, '/doctor/patients/p1?tab=visit')
    await fillVisit()
    await userEvent.click(screen.getByRole('button', { name: 'Save visit' }))

    expect(await screen.findByRole('heading', { name: 'Your access has ended' })).toBeInTheDocument()
  })

  it('says why the prescription failed', async () => {
    backend({
      'POST /doctor/records/r-new/prescription': { status: 503, body: { success: false, data: null, error: 'down' } },
    })
    renderRoutes(routes, '/doctor/patients/p1?tab=visit')
    await fillVisit()
    await userEvent.click(screen.getByRole('button', { name: 'Save visit' }))

    await screen.findByRole('button', { name: 'Save prescription again' })
    const alert = screen.getAllByRole('alert').find((el) => el.textContent?.includes('the prescription was not'))
    expect(alert).toHaveTextContent('Something went wrong. Please try again.')
  })

  it('blocks a half-filled medicine row', async () => {
    const { calls } = backend()
    renderRoutes(routes, '/doctor/patients/p1?tab=visit')
    await userEvent.type(await screen.findByLabelText('Diagnosis'), 'Pneumonia')
    await userEvent.type(screen.getByLabelText('Clinical note'), 'Note.')
    await userEvent.type(screen.getByLabelText('Medicine'), 'Amoxicillin')
    await userEvent.click(screen.getByRole('button', { name: 'Save visit' }))

    expect(await screen.findByText('Fill in name, dose and frequency, or remove this row')).toBeInTheDocument()
    expect(calls.some((c) => c.path === '/doctor/records')).toBe(false)
  })
})

describe('doctor pages in Bangla', () => {
  const ENGLISH = /Find patient|My patients|Good to see you|Allergies|Records|New visit|Send consent code|Save visit|Blood group/

  it.each(['/doctor', '/doctor/find?q=BD-2026-01240', '/doctor/patients', '/doctor/patients/p1', '/doctor/patients/p1?tab=visit'])(
    '%s has no untranslated UI text',
    async (path) => {
      await i18n.changeLanguage('bn')
      backend()
      renderRoutes(routes, path)
      await screen.findByRole('heading', { level: 1 })
      await waitFor(() => expect(screen.queryAllByRole('status', { name: 'কনটেন্ট লোড হচ্ছে' })).toHaveLength(0))
      const main = document.querySelector('main') ?? document.body
      expect(within(main as HTMLElement).queryByText(ENGLISH)).toBeNull()
      expect(document.body.textContent).not.toMatch(ENGLISH)
    },
  )
})
