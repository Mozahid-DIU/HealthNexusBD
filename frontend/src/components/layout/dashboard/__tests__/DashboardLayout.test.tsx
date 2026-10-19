import { beforeEach, describe, expect, it, vi } from 'vitest'
import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { routes } from '@/app/routes'
import { renderRoutes } from '@/test/render'
import { useAuthStore } from '@/stores/auth'
import { i18n } from '@/i18n'
import type { AuthUser } from '@/types/api'

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

const doctor: AuthUser = {
  id: 'd-1',
  email: 'ayesha.karim@hn.bd',
  phone: '01710000001',
  role: 'doctor',
  status: 'pending',
  doctor: { id: 'd1', bmdcNumber: 'A-29871', fullName: 'Dr. Ayesha Karim' },
}

let fetchMock: ReturnType<typeof vi.fn>

beforeEach(() => {
  vi.unstubAllGlobals()
  useAuthStore.getState().setAuth(doctor, 'access', 'refresh')
  fetchMock = vi.fn((input: RequestInfo | URL) => {
    const url = String(input)
    if (url.endsWith('/auth/logout')) return Promise.resolve(json({ success: true, data: {}, error: null }))
    return Promise.resolve(json({ success: true, data: doctor, error: null }))
  })
  vi.stubGlobal('fetch', fetchMock)
})

describe('DashboardLayout', () => {
  it('shows the portal, the user and live account data', async () => {
    renderRoutes(routes, '/doctor')

    expect(await screen.findByRole('heading', { name: 'Welcome, Dr. Ayesha Karim' })).toBeInTheDocument()
    expect(screen.getAllByText('Doctor portal').length).toBeGreaterThan(0)
    const account = screen.getByRole('region', { name: 'Account' })
    expect(within(account).getByText('ayesha.karim@hn.bd')).toBeInTheDocument()
    expect(within(account).getByText('Doctor')).toBeInTheDocument()
    expect(within(account).getByText('Pending')).toBeInTheDocument()
  })

  it('tells a pending doctor their account is awaiting verification', async () => {
    renderRoutes(routes, '/doctor')
    expect(await screen.findByText(/waiting for admin verification of your BMDC/)).toBeInTheDocument()
  })

  it('opens the mobile drawer, traps focus, and closes on Escape', async () => {
    renderRoutes(routes, '/doctor')
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
    renderRoutes(routes, '/doctor')
    await userEvent.click(await screen.findByRole('button', { name: 'Open menu' }))
    const drawer = screen.getByRole('dialog', { name: 'Dashboard navigation' })

    await userEvent.click(within(drawer).getByRole('link', { name: 'Overview' }))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(document.body.style.overflow).toBe('')
  })

  it('logs out: revokes on the server, clears the session and goes to login', async () => {
    const { router } = renderRoutes(routes, '/doctor')
    const sidebar = await screen.findByRole('complementary')

    await userEvent.click(within(sidebar).getByRole('button', { name: 'Log out' }))

    await waitFor(() => expect(router.state.location.pathname).toBe('/login'))
    expect(useAuthStore.getState().accessToken).toBeNull()
    expect(fetchMock.mock.calls.some(([u]) => String(u).endsWith('/auth/logout'))).toBe(true)
  })

  it('still signs out locally when the server is unreachable', async () => {
    fetchMock.mockImplementation((input: RequestInfo | URL) =>
      String(input).endsWith('/auth/logout')
        ? Promise.reject(new TypeError('offline'))
        : Promise.resolve(json({ success: true, data: doctor, error: null })),
    )
    const { router } = renderRoutes(routes, '/doctor')
    const sidebar = await screen.findByRole('complementary')

    await userEvent.click(within(sidebar).getByRole('button', { name: 'Log out' }))

    await waitFor(() => expect(router.state.location.pathname).toBe('/login'))
    expect(useAuthStore.getState().user).toBeNull()
  })

  it('switches the whole dashboard to Bangla', async () => {
    renderRoutes(routes, '/doctor')
    await screen.findByRole('heading', { name: 'Welcome, Dr. Ayesha Karim' })

    await userEvent.click(screen.getAllByRole('button', { name: 'বাংলা' })[0])

    expect(await screen.findByRole('heading', { name: 'স্বাগতম, Dr. Ayesha Karim' })).toBeInTheDocument()
    expect(screen.getAllByText('ডাক্তারের পোর্টাল').length).toBeGreaterThan(0)
    expect(screen.getAllByRole('link', { name: 'সারসংক্ষেপ' }).length).toBeGreaterThan(0)
    expect(document.documentElement.lang).toBe('bn')
    await i18n.changeLanguage('en')
  })

  it('falls back to the stored account when the live refresh fails (offline)', async () => {
    fetchMock.mockImplementation(() => Promise.reject(new TypeError('offline')))
    renderRoutes(routes, '/doctor')

    expect(await screen.findByRole('heading', { name: 'Welcome, Dr. Ayesha Karim' })).toBeInTheDocument()
    expect(within(screen.getByRole('region', { name: 'Account' })).getByText('ayesha.karim@hn.bd')).toBeInTheDocument()
    expect(useAuthStore.getState().accessToken).toBe('access') // offline must not sign the user out
  })
})
