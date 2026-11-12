import { beforeEach, describe, expect, it, vi } from 'vitest'
import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { routes } from '@/app/routes'
import { renderRoutes } from '@/test/render'
import { envelope, mockApi } from '@/test/mockApi'
import { useAuthStore } from '@/stores/auth'
import { i18n } from '@/i18n'
import type { AuthUser } from '@/types/api'

// The shell is the same for every role; a lab account has the simplest home page.
const lab: AuthUser = {
  id: 'l-1',
  email: 'pathcare@hn.bd',
  phone: '01720000001',
  role: 'lab',
  status: 'active',
  lab: { id: 'l1', licenseNumber: 'DGHS-LAB-0099', centerName: 'PathCare Diagnostics' },
}

const admin: AuthUser = {
  id: 'a-1',
  email: 'admin@hn.bd',
  phone: '01700000000',
  role: 'admin',
  status: 'active',
  admin: { id: 'a1', fullName: 'System Admin' },
}

function backend(over: Parameters<typeof mockApi>[0] = {}) {
  return mockApi({
    'GET /auth/me': { body: envelope(lab) },
    'GET /lab/uploads': { body: envelope([], { total: 0, page: 1, limit: 5 }) },
    'POST /auth/logout': { body: envelope({}) },
    ...over,
  })
}

beforeEach(() => {
  vi.unstubAllGlobals()
  useAuthStore.getState().setAuth(lab, 'access', 'refresh')
})

describe('DashboardLayout', () => {
  it('shows the portal, the signed-in account and the role’s navigation', async () => {
    backend()
    renderRoutes(routes, '/lab')

    expect(await screen.findByRole('heading', { name: 'Welcome, PathCare Diagnostics' })).toBeInTheDocument()
    expect(screen.getAllByText('Lab portal').length).toBeGreaterThan(0)
    const sidebar = screen.getByRole('complementary')
    expect(within(sidebar).getByText('pathcare@hn.bd')).toBeInTheDocument()
    expect(within(sidebar).getByRole('link', { name: 'Upload history' })).toHaveAttribute('href', '/lab/uploads')
  })

  it('opens the mobile drawer, traps focus, and closes on Escape', async () => {
    backend()
    renderRoutes(routes, '/lab')
    const openButton = await screen.findByRole('button', { name: 'Open menu' })

    await userEvent.click(openButton)
    const drawer = screen.getByRole('dialog', { name: 'Dashboard navigation' })
    expect(drawer).toContainElement(document.activeElement as HTMLElement)
    expect(document.body.style.overflow).toBe('hidden')

    await userEvent.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(openButton).toHaveFocus()
    expect(document.body.style.overflow).toBe('')
  })

  it('closes the drawer when tapping the page you are already on', async () => {
    backend()
    renderRoutes(routes, '/lab')
    await userEvent.click(await screen.findByRole('button', { name: 'Open menu' }))
    const drawer = screen.getByRole('dialog', { name: 'Dashboard navigation' })

    await userEvent.click(within(drawer).getByRole('link', { name: 'Overview' }))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(document.body.style.overflow).toBe('')
  })

  it('logs out: revokes on the server, clears the session and goes to login', async () => {
    const { calls } = backend()
    const { router } = renderRoutes(routes, '/lab')
    const sidebar = await screen.findByRole('complementary')

    await userEvent.click(within(sidebar).getByRole('button', { name: 'Log out' }))

    await waitFor(() => expect(router.state.location.pathname).toBe('/login'))
    expect(useAuthStore.getState().accessToken).toBeNull()
    expect(calls.some((c) => c.path === '/auth/logout')).toBe(true)
  })

  it('still signs out locally when the server is unreachable', async () => {
    const { fetchMock } = backend()
    const { router } = renderRoutes(routes, '/lab')
    const sidebar = await screen.findByRole('complementary')
    fetchMock.mockImplementation(() => Promise.reject(new TypeError('offline')))

    await userEvent.click(within(sidebar).getByRole('button', { name: 'Log out' }))

    await waitFor(() => expect(router.state.location.pathname).toBe('/login'))
    expect(useAuthStore.getState().user).toBeNull()
  })

  it('switches the whole dashboard to Bangla', async () => {
    backend()
    renderRoutes(routes, '/lab')
    await screen.findByRole('heading', { name: 'Welcome, PathCare Diagnostics' })

    await userEvent.click(screen.getAllByRole('button', { name: 'বাংলা' })[0])

    expect(await screen.findByRole('heading', { name: 'স্বাগতম, PathCare Diagnostics' })).toBeInTheDocument()
    expect(screen.getAllByText('ল্যাবের পোর্টাল').length).toBeGreaterThan(0)
    expect(screen.getAllByRole('link', { name: 'সারসংক্ষেপ' }).length).toBeGreaterThan(0)
    expect(document.documentElement.lang).toBe('bn')
    await i18n.changeLanguage('en')
  })

  it('keeps the session when the network is down', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new TypeError('offline'))))
    renderRoutes(routes, '/lab')

    expect(await screen.findByRole('heading', { name: 'Welcome, PathCare Diagnostics' })).toBeInTheDocument()
    expect(useAuthStore.getState().accessToken).toBe('access') // offline must not sign the user out
  })

  it('shows the admin how many applications are waiting, beside Verifications', async () => {
    useAuthStore.getState().setAuth(admin, 'access', 'refresh')
    backend({
      'GET /auth/me': { body: envelope(admin) },
      'GET /admin/dashboard': {
        body: envelope({
          users: { patients: 0, doctors: 0, labs: 0, total: 0 },
          pending: { doctors: 2, labs: 1 },
          suspended: 0,
          activeSessions: 0,
          clinical: { records: 0, labReports: 0 },
        }),
      },
    })
    renderRoutes(routes, '/admin/users')

    const sidebar = await screen.findByRole('complementary')
    expect(await within(sidebar).findByRole('link', { name: 'Verifications, 3 waiting' })).toHaveAttribute('href', '/admin/verifications')
  })
})
