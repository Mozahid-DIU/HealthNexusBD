import { beforeEach, describe, expect, it, vi } from 'vitest'
import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { routes } from '@/app/routes'
import { i18n } from '@/i18n'
import { renderRoutes } from '@/test/render'
import { envelope, mockApi } from '@/test/mockApi'
import { useAuthStore } from '@/stores/auth'
import type { AuthUser } from '@/types/api'
import type { LabSearchResult, LabUpload } from '../types'

const LAB: AuthUser = {
  id: 'u-l',
  email: 'pathcare@hn.bd',
  phone: '01720000001',
  role: 'lab',
  status: 'active',
  lab: { id: 'l1', licenseNumber: 'DGHS-LAB-0099', centerName: 'PathCare Diagnostics' },
}

const RESULT: LabSearchResult = {
  patientId: 'p1',
  uhid: 'BD-2026-01240',
  fullName: 'Nasrin Akter',
  gender: 'female',
  phone: '********007',
  prescribedTests: [
    { name: 'CBC', status: 'pending', prescribedAt: '2026-11-10T05:00:00Z' },
    { name: 'HbA1c', status: 'uploaded', prescribedAt: '2026-10-19T05:00:00Z' },
  ],
}

const UPLOAD: LabUpload = {
  id: 'rep-1',
  testName: 'HbA1c',
  patient: { uhid: 'BD-2026-01240', fullName: 'Nasrin Akter' },
  fileUrl: '/api/lab/reports/rep-1/file',
  isVerified: true,
  uploadedAt: '2026-10-20T08:30:00Z',
}

const META = (total: number) => ({ total, page: 1, limit: 10 })
const pdf = (body = '%PDF-1.4 test', name = 'cbc.pdf') => new File([body], name, { type: 'application/pdf' })

function backend(over: Record<string, Parameters<typeof mockApi>[0][string]> = {}) {
  return mockApi({
    'GET /auth/me': { body: envelope(LAB) },
    'GET /lab/search': { body: envelope(RESULT) },
    'GET /lab/uploads': { body: envelope([UPLOAD], META(1)) },
    'POST /lab/reports': { status: 201, body: envelope({ id: 'rep-2', testName: 'CBC', uploadedAt: new Date().toISOString() }) },
    'GET /lab/reports/rep-1/file': { blob: '%PDF-1.4' },
    ...over,
  })
}

beforeEach(() => {
  vi.unstubAllGlobals()
  useAuthStore.getState().setAuth(LAB, 'access', 'refresh')
})

describe('verification gate', () => {
  it('shows the pending screen with the licence, then unlocks once approved', async () => {
    useAuthStore.getState().setAuth({ ...LAB, status: 'pending' }, 'access', 'refresh')
    let approved = false
    backend({ 'GET /auth/me': () => ({ body: envelope({ ...LAB, status: approved ? 'active' : 'pending' }) }) })
    renderRoutes(routes, '/lab')

    expect(await screen.findByRole('heading', { name: 'Your account is being verified' })).toBeInTheDocument()
    expect(screen.getByText('DGHS-LAB-0099')).toBeInTheDocument()
    expect(screen.getByText('DGHS licence:')).toBeInTheDocument()

    approved = true
    await userEvent.click(screen.getByRole('button', { name: 'Check again' }))
    expect(await screen.findByRole('heading', { name: 'Welcome, PathCare Diagnostics' })).toBeInTheDocument()
  })
})

describe('lab home', () => {
  it('shows recent uploads and hands a search to the upload page', async () => {
    backend()
    const { router } = renderRoutes(routes, '/lab')

    expect(await screen.findByText('Total uploaded: 1')).toBeInTheDocument()
    const recent = screen.getByRole('region', { name: 'Recent uploads' })
    expect(within(recent).getByText('HbA1c')).toBeInTheDocument()
    expect(within(recent).getByText('Nasrin Akter · BD-2026-01240')).toBeInTheDocument()
    expect(within(recent).getByRole('button', { name: /^View: HbA1c/ })).toBeInTheDocument()

    await userEvent.type(screen.getByLabelText('UHID or mobile number'), 'bd-2026-01240')
    await userEvent.click(screen.getByRole('button', { name: 'Find patient' }))
    await waitFor(() => expect(router.state.location.pathname).toBe('/lab/upload'))
    expect(await screen.findByRole('heading', { name: 'Nasrin Akter' })).toBeInTheDocument()
  })

  it('explains the three steps before the first upload', async () => {
    backend({ 'GET /lab/uploads': { body: envelope([], META(0)) } })
    renderRoutes(routes, '/lab')
    expect(await screen.findByText('How uploading works')).toBeInTheDocument()
    expect(screen.getByText('Pick a test their doctor ordered.')).toBeInTheDocument()
  })
})

describe('upload a report', () => {
  it('lists the ordered tests, pending first, with a masked phone to confirm the patient', async () => {
    backend()
    renderRoutes(routes, '/lab/upload?q=BD-2026-01240')

    expect(await screen.findByRole('heading', { name: 'Nasrin Akter' })).toBeInTheDocument()
    expect(screen.getByText('********007')).toBeInTheDocument()
    expect(screen.getByText('Waiting for a report: 1')).toBeInTheDocument()
    const rows = within(screen.getByRole('region', { name: 'Nasrin Akter' })).getAllByRole('listitem')
    expect(rows[0]).toHaveTextContent('CBC')
    expect(rows[0]).toHaveTextContent('Waiting for report')
    expect(rows[1]).toHaveTextContent('HbA1c')
    expect(rows[1]).toHaveTextContent('Uploaded')
  })

  it('uploads a checked PDF for the chosen test, then marks it done', async () => {
    let uploaded = false
    const { calls } = backend({
      'GET /lab/search': () => ({
        body: envelope({
          ...RESULT,
          prescribedTests: RESULT.prescribedTests.map((t) => (t.name === 'CBC' && uploaded ? { ...t, status: 'uploaded' } : t)),
        }),
      }),
      'POST /lab/reports': () => {
        uploaded = true
        return { status: 201, body: envelope({ id: 'rep-2', testName: 'CBC', uploadedAt: new Date().toISOString() }) }
      },
    })
    renderRoutes(routes, '/lab/upload?q=BD-2026-01240')

    await userEvent.click(await screen.findByRole('button', { name: 'Upload report: CBC' }))
    const dialog = screen.getByRole('dialog', { name: 'Upload CBC report' })
    expect(dialog).toHaveTextContent('For Nasrin Akter · BD-2026-01240')
    const submit = within(dialog).getByRole('button', { name: 'Upload report' })
    expect(submit).toBeDisabled()

    // A file that only pretends to be a PDF is caught before any upload.
    await userEvent.upload(within(dialog).getByLabelText('Choose a PDF'), pdf('MZ fake', 'fake.pdf'))
    expect(await within(dialog).findByRole('alert')).toHaveTextContent('This is not a PDF')
    expect(submit).toBeDisabled()

    await userEvent.upload(within(dialog).getByLabelText('Choose a PDF'), pdf())
    expect(await within(dialog).findByText('cbc.pdf')).toBeInTheDocument()
    await userEvent.click(submit)

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    const form = calls.find((c) => c.method === 'POST' && c.path === '/lab/reports')!.body as FormData
    expect(form.get('uhid')).toBe('BD-2026-01240')
    expect(form.get('testName')).toBe('CBC')
    expect((form.get('file') as File).name).toBe('cbc.pdf')
    expect(await screen.findByText('CBC report uploaded. Nasrin Akter has been notified.')).toBeInTheDocument()
    expect(await screen.findByText('Uploaded just now')).toBeInTheDocument()
    expect(screen.getByText('Every ordered test has a report.')).toBeInTheDocument()
  })

  it('keeps the dialog open, explains a refusal and refreshes the ordered tests', async () => {
    const { calls } = backend({
      'POST /lab/reports': {
        status: 403,
        body: { success: false, data: null, error: '"CBC" was not prescribed', code: 'TEST_NOT_PRESCRIBED' },
      },
    })
    renderRoutes(routes, '/lab/upload?q=BD-2026-01240')
    await userEvent.click(await screen.findByRole('button', { name: 'Upload report: CBC' }))
    const dialog = screen.getByRole('dialog')
    await userEvent.upload(within(dialog).getByLabelText('Choose a PDF'), pdf())
    await userEvent.click(await within(dialog).findByRole('button', { name: 'Upload report' }))

    expect(await within(dialog).findByText(/This test was not prescribed for this patient/)).toBeInTheDocument()
    // The list may be out of date (the doctor changed the prescription): fetch it again.
    await waitFor(() => expect(calls.filter((c) => c.path === '/lab/search')).toHaveLength(2))
  })

  it('opens a clean dialog for each test', async () => {
    backend()
    renderRoutes(routes, '/lab/upload?q=BD-2026-01240')
    await userEvent.click(await screen.findByRole('button', { name: 'Upload report: CBC' }))
    await userEvent.upload(within(screen.getByRole('dialog')).getByLabelText('Choose a PDF'), pdf())
    await within(screen.getByRole('dialog')).findByText('cbc.pdf')
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }))

    await userEvent.click(screen.getByRole('button', { name: 'Upload again: HbA1c' }))
    expect(within(screen.getByRole('dialog')).queryByText('cbc.pdf')).not.toBeInTheDocument()
    expect(within(screen.getByRole('dialog')).getByLabelText('Choose a PDF')).toBeInTheDocument()
  })

  it('says when no tests have been ordered', async () => {
    backend({ 'GET /lab/search': { body: envelope({ ...RESULT, prescribedTests: [] }) } })
    renderRoutes(routes, '/lab/upload?q=BD-2026-01240')
    expect(await screen.findByText('No tests ordered yet')).toBeInTheDocument()
  })

  it('says so when nobody matches', async () => {
    backend({ 'GET /lab/search': { status: 404, body: { success: false, data: null, error: 'No patient found' } } })
    renderRoutes(routes, '/lab/upload?q=BD-2026-99999')
    expect(await screen.findByText('No patient found with this UHID or number.')).toBeInTheDocument()
  })

  it('searches by phone but keeps only the UHID in the address bar', async () => {
    const { calls } = backend()
    const { router } = renderRoutes(routes, '/lab/upload?q=01810000007')
    await screen.findByRole('heading', { name: 'Nasrin Akter' })
    expect(calls.find((c) => c.path === '/lab/search')).toBeTruthy()
    await waitFor(() => expect(router.state.location.search).toBe('?q=BD-2026-01240'))
  })
})

describe('upload history', () => {
  it('lists every upload with view and download', async () => {
    backend()
    renderRoutes(routes, '/lab/uploads')
    expect(await screen.findByRole('heading', { level: 1, name: 'Upload history' })).toBeInTheDocument()
    expect(await screen.findByRole('button', { name: /^Download: HbA1c/ })).toBeInTheDocument()
  })

  it('has a friendly empty state', async () => {
    backend({ 'GET /lab/uploads': { body: envelope([], META(0)) } })
    renderRoutes(routes, '/lab/uploads')
    expect(await screen.findByText('No reports uploaded yet')).toBeInTheDocument()
  })
})

describe('lab pages in Bangla', () => {
  const ENGLISH = /Upload report|Upload history|Recent uploads|Waiting for|Ordered |Find patient|Total uploaded|How uploading/

  it.each(['/lab', '/lab/upload?q=BD-2026-01240', '/lab/uploads'])('%s has no untranslated UI text', async (path) => {
    await i18n.changeLanguage('bn')
    backend()
    renderRoutes(routes, path)
    await screen.findByRole('heading', { level: 1 })
    await waitFor(() => expect(screen.queryAllByRole('status', { name: 'কনটেন্ট লোড হচ্ছে' })).toHaveLength(0))
    expect(document.body.textContent).not.toMatch(ENGLISH)
    await i18n.changeLanguage('en')
  })
})
