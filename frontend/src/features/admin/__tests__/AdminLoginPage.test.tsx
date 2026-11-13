import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { routes } from '@/app/routes'
import { i18n } from '@/i18n'
import { useAuthStore } from '@/stores/auth'
import { envelope, mockApi } from '@/test/mockApi'
import { renderRoutes } from '@/test/render'
import type { AuthUser } from '@/types/api'

const admin: AuthUser = {
  id: 'admin-1',
  email: 'admin@healthnexus.bd',
  phone: '01700000000',
  role: 'admin',
  status: 'active',
  admin: { id: 'a1', fullName: 'System Admin' },
}
const patient: AuthUser = {
  id: 'patient-1',
  email: 'rahim@hn.bd',
  phone: '01711111111',
  role: 'patient',
  status: 'active',
  patient: { id: 'p1', uhid: 'BD-2026-01240', fullName: 'Rahim Uddin' },
}

const INVALID = { success: false, data: null, error: 'Invalid credentials', code: 'UNAUTHORIZED' }

beforeEach(() => {
  vi.unstubAllGlobals()
  useAuthStore.getState().clear()
})

afterEach(async () => {
  await i18n.changeLanguage('en')
})

async function signInAs(email: string) {
  await userEvent.type(screen.getByLabelText('Admin email'), email)
  await userEvent.type(screen.getByLabelText('Password'), 'Secret@123')
  await userEvent.click(screen.getByRole('button', { name: 'Sign in to the console' }))
}

describe('admin console sign-in', () => {
  it('sends a signed-out visitor from the console to its own entrance, then back where they were going', async () => {
    const { calls } = mockApi({
      'POST /auth/login': { body: envelope({ user: admin, accessToken: 'a', refreshToken: 'r' }) },
      'GET /auth/me': { body: envelope(admin) },
    })
    const { router } = renderRoutes(routes, '/admin/users?q=rahim')

    await waitFor(() => expect(router.state.location.pathname).toBe('/admin/login'))
    expect(await screen.findByRole('heading', { name: 'Sign in to the console' })).toBeInTheDocument()

    await signInAs(admin.email)

    await waitFor(() => expect(router.state.location.pathname).toBe('/admin/users'))
    expect(router.state.location.search).toBe('?q=rahim')
    expect(calls.find((c) => c.path === '/auth/login')?.body).toEqual({
      identifier: admin.email,
      password: 'Secret@123',
      portal: 'admin',
    })
  })

  it('turns a non-admin away with the ordinary wrong-credentials message and points to the main sign-in', async () => {
    mockApi({ 'POST /auth/login': { status: 401, body: INVALID } })
    const { router } = renderRoutes(routes, '/admin/login')
    await screen.findByRole('heading', { name: 'Sign in to the console' })

    await signInAs(patient.email)

    expect(await screen.findByText('Incorrect email/phone or password.')).toHaveAttribute('role', 'alert')
    expect(router.state.location.pathname).toBe('/admin/login')
    expect(useAuthStore.getState().accessToken).toBeNull()
    expect(screen.getByRole('link', { name: 'Use the main sign-in' })).toHaveAttribute('href', '/login')
  })

  it('checks the fields before calling the server', async () => {
    const { calls } = mockApi({})
    renderRoutes(routes, '/admin/login')
    await screen.findByRole('heading', { name: 'Sign in to the console' })

    await userEvent.click(screen.getByRole('button', { name: 'Sign in to the console' }))

    expect(await screen.findByText('Enter your email or phone')).toBeInTheDocument()
    expect(calls.filter((c) => c.path === '/auth/login')).toHaveLength(0)
  })

  it('sends someone already signed in straight to their own dashboard', async () => {
    useAuthStore.getState().setAuth(patient, 'access', 'refresh')
    mockApi({ 'GET /auth/me': { body: envelope(patient) } })
    const { router } = renderRoutes(routes, '/admin/login')
    await waitFor(() => expect(router.state.location.pathname).toBe('/patient'))
  })

  it('returns an admin to the console entrance on sign-out', async () => {
    useAuthStore.getState().setAuth(admin, 'access', 'refresh')
    mockApi({ 'GET /auth/me': { body: envelope(admin) }, 'POST /auth/logout': { body: envelope({}) } })
    const { router } = renderRoutes(routes, '/admin/audit')
    const sidebar = await screen.findByRole('complementary')

    await userEvent.click(within(sidebar).getByRole('button', { name: 'Log out' }))

    await waitFor(() => expect(router.state.location.pathname).toBe('/admin/login'))
    expect(useAuthStore.getState().user).toBeNull()
  })

  it('reads entirely in Bangla when switched', async () => {
    await i18n.changeLanguage('bn')
    mockApi({})
    renderRoutes(routes, '/admin/login')

    expect(await screen.findByRole('heading', { name: 'কনসোলে সাইন ইন করুন' })).toBeInTheDocument()
    expect(screen.getByLabelText('অ্যাডমিন ইমেইল')).toBeInTheDocument()
    expect(document.body.textContent).not.toMatch(/Sign in|Admin|Password|Back to|Forgot|Authorised|main sign-in/)
  })
})
