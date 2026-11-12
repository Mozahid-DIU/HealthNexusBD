import { beforeEach, describe, expect, it, vi } from 'vitest'
import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { routes } from '@/app/routes'
import { i18n } from '@/i18n'
import { renderRoutes } from '@/test/render'
import { envelope, mockApi } from '@/test/mockApi'
import { useAuthStore } from '@/stores/auth'
import type { AuthUser } from '@/types/api'
import type { AdminUser, AuditRow, Dashboard, DoctorApplication, LabApplication, Trends, TrendPoint } from '../types'

const ADMIN: AuthUser = {
  id: 'u-a',
  email: 'admin@hn.bd',
  phone: '01700000000',
  role: 'admin',
  status: 'active',
  admin: { id: 'a1', fullName: 'System Admin' },
}

const DASHBOARD: Dashboard = {
  users: { patients: 120, doctors: 14, labs: 5, total: 139 },
  pending: { doctors: 2, labs: 1 },
  suspended: 3,
  activeSessions: 4,
  clinical: { records: 310, labReports: 88 },
}

function trends(days: number): Trends {
  const series: TrendPoint[] = Array.from({ length: days }, (_, i) => ({
    date: new Date(Date.UTC(2026, 10, 12 - (days - 1 - i))).toISOString().slice(0, 10),
    patients: i === days - 1 ? 3 : 1,
    doctors: i % 3 === 0 ? 1 : 0,
    labs: 0,
    records: 2,
    labReports: 1,
    consents: i % 2,
  }))
  const sum = (k: keyof Omit<TrendPoint, 'date'>) => series.reduce((n, p) => n + p[k], 0)
  return {
    days,
    series,
    totals: {
      current: { patients: sum('patients'), doctors: sum('doctors'), labs: 0, records: sum('records'), labReports: sum('labReports'), consents: sum('consents') },
      previous: { patients: 10, doctors: 0, labs: 0, records: sum('records'), labReports: 0, consents: 0 },
    },
  }
}

const DOCTOR: DoctorApplication = {
  id: 'd1',
  fullName: 'Dr. Ayesha Karim',
  bmdcNumber: 'A-29871',
  specialization: 'Cardiologist',
  isBmdcVerified: false,
  approvedAt: null,
  account: { id: 'u1', email: 'ayesha@hn.bd', phone: '01710000001', status: 'pending', createdAt: '2026-11-10T05:00:00Z' },
  registry: { fullName: 'Dr. Ayesha Karim', specialization: 'Cardiologist' },
}
const IMPOSTOR: DoctorApplication = {
  ...DOCTOR,
  id: 'd2',
  fullName: 'Dr. Rafiq Hasan',
  bmdcNumber: 'A-11111',
  account: { ...DOCTOR.account, id: 'u2', email: 'rafiq@hn.bd' },
  registry: { fullName: 'Dr. Mahmud Alam', specialization: null },
}
const LAB: LabApplication = {
  id: 'l1',
  centerName: 'Medinova Diagnostics',
  licenseNumber: 'DGHS-LAB-0410',
  address: 'Malibagh, Dhaka',
  isApproved: false,
  account: { id: 'u3', email: 'medinova@hn.bd', phone: '01720000005', status: 'pending', createdAt: '2026-11-11T05:00:00Z' },
  registry: null,
}

const USERS: AdminUser[] = [
  { id: 'u10', email: 'nasrin@hn.bd', phone: '01810000007', role: 'patient', status: 'active', createdAt: '2026-10-01T00:00:00Z', patient: { fullName: 'Nasrin Akter', uhid: 'BD-2026-01240' }, doctor: null, lab: null, admin: null },
  { id: 'u11', email: 'admin@hn.bd', phone: '01700000000', role: 'admin', status: 'active', createdAt: '2026-08-01T00:00:00Z', patient: null, doctor: null, lab: null, admin: { fullName: 'System Admin' } },
]

const AUDIT: AuditRow[] = [
  { id: 'e1', action: 'update', resource: 'doctor_rejected:d9 (Name does not match the registry)', ipAddress: '10.0.0.1', createdAt: new Date().toISOString(), actor: { email: 'admin@hn.bd', role: 'admin' }, patient: null },
  { id: 'e2', action: 'view', resource: 'patient_profile:p1', ipAddress: null, createdAt: new Date().toISOString(), actor: { email: 'ayesha@hn.bd', role: 'doctor' }, patient: { uhid: 'BD-2026-01240', fullName: 'Nasrin Akter' } },
]

const meta = (total: number) => ({ total, page: 1, limit: 12 })

function backend(over: Parameters<typeof mockApi>[0] = {}) {
  return mockApi({
    'GET /auth/me': { body: envelope(ADMIN) },
    'GET /admin/dashboard': { body: envelope(DASHBOARD) },
    'GET /admin/trends': ({ query }) => ({ body: envelope(trends(Number(query.get('days') ?? 30))) }),
    'GET /admin/audit': { body: envelope(AUDIT, meta(2)) },
    'GET /admin/doctors': { body: envelope([DOCTOR, IMPOSTOR], meta(2)) },
    'GET /admin/labs': { body: envelope([LAB], meta(1)) },
    'GET /admin/users': { body: envelope(USERS, meta(2)) },
    'POST /admin/doctors/d1/approve': { body: envelope({ id: 'd1', status: 'approved' }) },
    'POST /admin/doctors/d1/reject': { body: envelope({ id: 'd1', status: 'rejected' }) },
    'POST /admin/users/u10/suspend': { body: envelope({ id: 'u10', status: 'suspended' }) },
    ...over,
  })
}

/** mockApi drops the query string from `path`; read it from the fetch call instead. */
const queryOf = (fetchMock: ReturnType<typeof vi.fn>, path: string) =>
  fetchMock.mock.calls.map(([u]) => new URL(String(u))).filter((u) => u.pathname.endsWith(path)).map((u) => u.searchParams)

beforeEach(() => {
  vi.unstubAllGlobals()
  useAuthStore.getState().setAuth(ADMIN, 'access', 'refresh')
})

describe('admin overview', () => {
  it('leads with real totals and asks for a decision on waiting applications', async () => {
    backend()
    renderRoutes(routes, '/admin')

    const hero = await screen.findByRole('region', { name: 'People on HealthNexus' })
    expect(within(hero).getByText('139')).toBeInTheDocument()
    expect(within(hero).getByText('120')).toBeInTheDocument()
    expect(screen.getByText('Waiting for your decision')).toBeInTheDocument()
    expect(screen.getByText(/Doctors: 2 · Labs: 1/)).toBeInTheDocument()
    expect(within(screen.getByRole('region', { name: 'Medical records' })).getByText('310')).toBeInTheDocument()
    expect(within(screen.getByRole('region', { name: 'Doctors with access now' })).getByText('4')).toBeInTheDocument()
  })

  it('compares the period with the one before it', async () => {
    backend()
    renderRoutes(routes, '/admin')
    const hero = await screen.findByRole('region', { name: 'People on HealthNexus' })
    // 30 days: 29×1 + 3 patients and 10 doctors = 42 joined, vs 10 before → +320%.
    expect(await within(hero).findByText('Joined in the last 30 days: 42')).toBeInTheDocument()
    expect(within(hero).getByText('320% more than the previous 30 days')).toBeInTheDocument()
    expect(within(screen.getByRole('region', { name: 'Lab reports' })).getByText('None in the previous 30 days')).toBeInTheDocument()
    expect(within(screen.getByRole('region', { name: 'Medical records' })).getByText('Same as the previous 30 days')).toBeInTheDocument()
  })

  it('draws both charts with legends, a keyboard read-out and a data table', async () => {
    backend()
    renderRoutes(routes, '/admin')

    const chart = await screen.findByRole('group', { name: 'Clinical activity' })
    expect(chart).toHaveAccessibleDescription(/Over the last 30 days: 60 records.*arrow keys/)
    const card = chart.closest('section')!
    expect(within(card).getByText('Records')).toBeInTheDocument()
    expect(within(card).getByText('60')).toBeInTheDocument() // 30 days × 2 records

    chart.focus()
    await userEvent.keyboard('{ArrowLeft}')
    expect(within(chart).getByText(/^11 Nov: Records 2, Consents/)).toBeInTheDocument()

    await userEvent.click(within(card).getByRole('button', { name: 'Show data table' }))
    const table = within(card).getByRole('table', { name: 'Clinical activity' })
    expect(within(table).getAllByRole('row')).toHaveLength(31)
    expect(screen.getByRole('group', { name: 'New registrations' })).toBeInTheDocument()
  })

  it('switches the range for every chart and keeps it in the URL', async () => {
    const { fetchMock } = backend()
    const { router } = renderRoutes(routes, '/admin')
    await screen.findByRole('group', { name: 'Clinical activity' })

    await userEvent.click(screen.getByRole('button', { name: '7 days' }))

    expect(screen.getByRole('button', { name: '7 days' })).toHaveAttribute('aria-pressed', 'true')
    await waitFor(() => expect(queryOf(fetchMock, '/admin/trends').some((q) => q.get('days') === '7')).toBe(true))
    expect(router.state.location.search).toBe('?range=7')
    expect(await screen.findByText('Joined in the last 7 days: 12')).toBeInTheDocument()
  })

  it('turns audit entries into a readable activity feed, without sign-ins', async () => {
    const { fetchMock } = backend()
    renderRoutes(routes, '/admin')
    const feed = await screen.findByRole('region', { name: 'Recent activity' })
    expect(queryOf(fetchMock, '/admin/audit')[0].get('exclude')).toBe('login')
    expect(await within(feed).findByText('Rejected a doctor')).toBeInTheDocument()
    expect(within(feed).getByText('Opened a patient’s health profile')).toBeInTheDocument()
    expect(within(feed).getByText(/ayesha@hn.bd · Doctor → Nasrin Akter/)).toBeInTheDocument()
  })
})

describe('verifications', () => {
  it('puts each application beside the registry record and flags a mismatch', async () => {
    backend()
    renderRoutes(routes, '/admin/verifications')

    await screen.findByText('A-29871')
    const items = screen.getAllByRole('listitem')
    const ayesha = items.find((li) => li.textContent?.includes('A-29871'))!
    const rafiq = items.find((li) => li.textContent?.includes('A-11111'))!
    expect(within(ayesha).getByText('Name matches the registry')).toBeInTheDocument()
    expect(within(rafiq).getByText(/Name differs from the registry/)).toBeInTheDocument()
    expect(within(rafiq).getByText('Dr. Mahmud Alam')).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /Doctors/ })).toHaveTextContent('2')
  })

  it('approves after confirming, then refreshes the queue and the counts', async () => {
    const { calls } = backend()
    renderRoutes(routes, '/admin/verifications')

    await userEvent.click(await screen.findByRole('button', { name: 'Approve: Dr. Ayesha Karim' }))
    const dialog = screen.getByRole('dialog', { name: 'Approve Dr. Ayesha Karim?' })
    await userEvent.click(within(dialog).getByRole('button', { name: 'Approve' }))

    expect(await screen.findByText('Dr. Ayesha Karim is approved and can use HealthNexus now.')).toBeInTheDocument()
    expect(calls.some((c) => c.method === 'POST' && c.path === '/admin/doctors/d1/approve')).toBe(true)
    await waitFor(() => expect(calls.filter((c) => c.path === '/admin/doctors').length).toBeGreaterThan(1))
  })

  it('will not reject without a reason, and sends the reason', async () => {
    const { calls } = backend()
    renderRoutes(routes, '/admin/verifications')

    await userEvent.click(await screen.findByRole('button', { name: 'Reject: Dr. Ayesha Karim' }))
    const dialog = screen.getByRole('dialog', { name: 'Reject Dr. Ayesha Karim?' })
    await userEvent.click(within(dialog).getByRole('button', { name: 'Reject' }))
    expect(within(dialog).getByText('Write a reason of at least 3 characters.')).toBeInTheDocument()
    expect(calls.some((c) => c.path.endsWith('/reject'))).toBe(false)

    await userEvent.type(within(dialog).getByLabelText('Reason'), 'BMDC number belongs to someone else')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Reject' }))

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(calls.find((c) => c.path === '/admin/doctors/d1/reject')!.body).toEqual({ reason: 'BMDC number belongs to someone else' })
  })

  it('shows labs on their own tab, and says when one is not in the registry', async () => {
    const { fetchMock } = backend()
    const { router } = renderRoutes(routes, '/admin/verifications')
    await userEvent.click(await screen.findByRole('tab', { name: /Labs/ }))

    expect((await screen.findAllByText('Medinova Diagnostics')).length).toBeGreaterThan(0)
    expect(screen.getByText('Not found in the registry')).toBeInTheDocument()
    expect(router.state.location.search).toBe('?type=lab')
    expect(queryOf(fetchMock, '/admin/labs').at(-1)!.get('status')).toBe('pending')
  })
})

describe('users', () => {
  it('searches after typing pauses and filters by role, keeping both in the URL', async () => {
    const { fetchMock } = backend()
    const { router } = renderRoutes(routes, '/admin/users')
    await screen.findAllByText('Nasrin Akter')

    await userEvent.type(screen.getByLabelText('Search users'), 'nasrin')
    await waitFor(() => expect(router.state.location.search).toBe('?q=nasrin'))
    // The page has re-rendered with the search applied (its request went out).
    await waitFor(() => expect(queryOf(fetchMock, '/admin/users').some((q) => q.get('q') === 'nasrin')).toBe(true))
    await userEvent.selectOptions(screen.getByLabelText('Role'), 'patient')

    await waitFor(() => expect(queryOf(fetchMock, '/admin/users').at(-1)!.toString()).toBe('q=nasrin&role=patient&page=1&limit=12'))
    // Typing does not fire a request per keystroke.
    expect(queryOf(fetchMock, '/admin/users').filter((q) => q.get('q') && q.get('q') !== 'nasrin')).toHaveLength(0)
  })

  it('suspends after confirming, and never offers it for an admin', async () => {
    const { calls } = backend()
    renderRoutes(routes, '/admin/users')
    await screen.findAllByText('Nasrin Akter')

    expect(screen.queryByRole('button', { name: 'Suspend: System Admin' })).not.toBeInTheDocument()
    await userEvent.click(screen.getAllByRole('button', { name: 'Suspend: Nasrin Akter' })[0])
    const dialog = screen.getByRole('dialog', { name: 'Suspend Nasrin Akter?' })
    expect(dialog).toHaveTextContent('signed out on every device')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Suspend' }))

    expect(await screen.findByText('Nasrin Akter is suspended and signed out.')).toBeInTheDocument()
    expect(calls.find((c) => c.path === '/admin/users/u10/suspend')!.body).toEqual({ suspend: true })
  })

  it('sends a rejected, never-verified doctor to Verifications instead of reactivating', async () => {
    backend({
      'GET /admin/users': {
        body: envelope(
          [{ id: 'u20', email: 'rafiq@hn.bd', phone: '01710000099', role: 'doctor', status: 'suspended', createdAt: '2026-11-01T00:00:00Z', patient: null, doctor: { fullName: 'Dr. Rafiq Hasan', bmdcNumber: 'A-11111', isBmdcVerified: false }, lab: null, admin: null }],
          meta(1),
        ),
      },
    })
    renderRoutes(routes, '/admin/users')
    const links = await screen.findAllByRole('link', { name: 'Verify first: Dr. Rafiq Hasan' })
    expect(links[0]).toHaveAttribute('href', '/admin/verifications?status=suspended')
    expect(screen.queryByRole('button', { name: /Reactivate/ })).not.toBeInTheDocument()
  })

  it('offers to clear filters when nothing matches', async () => {
    backend({ 'GET /admin/users': { body: envelope([], meta(0)) } })
    const { router } = renderRoutes(routes, '/admin/users?q=zzz&role=lab')
    await userEvent.click(await screen.findByRole('button', { name: 'Clear filters' }))
    await waitFor(() => expect(router.state.location.search).toBe(''))
  })
})

describe('audit log', () => {
  it('reads like sentences, with the rejection reason and the patient', async () => {
    backend()
    renderRoutes(routes, '/admin/audit')
    expect((await screen.findAllByText('Rejected a doctor')).length).toBeGreaterThan(0)
    expect(screen.getAllByText('Reason: Name does not match the registry').length).toBeGreaterThan(0)
    expect(screen.getAllByText('BD-2026-01240', { exact: false }).length).toBeGreaterThan(0)
  })

  it('filters by action', async () => {
    const { fetchMock } = backend()
    renderRoutes(routes, '/admin/audit')
    await screen.findAllByText('Rejected a doctor')
    await userEvent.selectOptions(screen.getByLabelText('What'), 'grant')
    await waitFor(() => expect(queryOf(fetchMock, '/admin/audit').at(-1)!.get('action')).toBe('grant'))
  })
})

describe('admin pages in Bangla', () => {
  const ENGLISH = /Platform overview|Verifications|Approve|Suspend|Audit log|Clinical activity|Recent activity|Show data table|Waiting for|Users/

  it.each(['/admin', '/admin/verifications', '/admin/users', '/admin/audit'])('%s has no untranslated UI text', async (path) => {
    await i18n.changeLanguage('bn')
    backend()
    renderRoutes(routes, path)
    await screen.findByRole('heading', { level: 1 })
    await waitFor(() => expect(screen.queryAllByRole('status', { name: 'কনটেন্ট লোড হচ্ছে' })).toHaveLength(0))
    expect(document.body.textContent).not.toMatch(ENGLISH)
    await i18n.changeLanguage('en')
  })
})
