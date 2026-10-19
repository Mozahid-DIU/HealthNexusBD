import { beforeEach, describe, expect, it, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { routes } from '../routes'
import { renderRoutes } from '@/test/render'
import { useAuthStore } from '@/stores/auth'
import type { AuthUser, Role } from '@/types/api'

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

function makeUser(role: Role, status: AuthUser['status'] = 'active'): AuthUser {
  const base = { id: `${role}-1`, email: `${role}@hn.bd`, phone: '01711111111', role, status }
  if (role === 'patient') return { ...base, patient: { id: 'p1', uhid: 'BD-2026-01240', fullName: 'Nasrin Akter' } }
  if (role === 'doctor') return { ...base, doctor: { id: 'd1', bmdcNumber: 'A-1', fullName: 'Dr. Ayesha Karim' } }
  if (role === 'lab') return { ...base, lab: { id: 'l1', licenseNumber: 'L-1', centerName: 'PathCare Diagnostics' } }
  return { ...base, admin: { id: 'a1', fullName: 'System Admin' } }
}

function signIn(user: AuthUser) {
  useAuthStore.getState().setAuth(user, 'access', 'refresh')
  vi.stubGlobal(
    'fetch',
    vi.fn((input: RequestInfo | URL) =>
      Promise.resolve(String(input).endsWith('/auth/me') ? json({ success: true, data: user, error: null }) : json({}, 404)),
    ),
  )
}

beforeEach(() => {
  vi.unstubAllGlobals()
})

describe('routing & guards', () => {
  it('sends a signed-out visitor from a dashboard to login', async () => {
    const { router } = renderRoutes(routes, '/patient')
    await waitFor(() => expect(router.state.location.pathname).toBe('/login'))
    expect(router.state.location.state).toEqual({ from: '/patient' })
  })

  it.each(['patient', 'doctor', 'lab', 'admin'] as const)('lets a %s into their own dashboard', async (role) => {
    const user = makeUser(role)
    signIn(user)
    renderRoutes(routes, `/${role}`)

    expect(await screen.findByRole('heading', { level: 1 })).toHaveTextContent(/Welcome,/)
    expect(screen.getAllByRole('link', { name: 'Overview' })[0]).toHaveAttribute('aria-current', 'page')
  })

  it('redirects a user away from another role’s dashboard', async () => {
    signIn(makeUser('patient'))
    const { router } = renderRoutes(routes, '/admin')
    await waitFor(() => expect(router.state.location.pathname).toBe('/patient'))
  })

  it('keeps signed-in users out of login/register', async () => {
    signIn(makeUser('doctor'))
    const { router } = renderRoutes(routes, '/login')
    await waitFor(() => expect(router.state.location.pathname).toBe('/doctor'))
  })

  it('maps the legacy /app link to the role home', async () => {
    signIn(makeUser('lab'))
    const { router } = renderRoutes(routes, '/app')
    await waitFor(() => expect(router.state.location.pathname).toBe('/lab'))
  })

  it('shows a real 404 page for unknown paths', async () => {
    renderRoutes(routes, '/no/such/page')
    expect(await screen.findByRole('heading', { name: 'Page not found' })).toBeInTheDocument()
  })

  it('returns the user to the page they wanted after logging in', async () => {
    const user = makeUser('patient')
    vi.stubGlobal(
      'fetch',
      vi.fn((input: RequestInfo | URL) => {
        const url = String(input)
        if (url.endsWith('/auth/login'))
          return Promise.resolve(json({ success: true, data: { user, accessToken: 'a', refreshToken: 'r' }, error: null }))
        return Promise.resolve(json({ success: true, data: user, error: null }))
      }),
    )
    const { router } = renderRoutes(routes, '/patient')
    await screen.findByRole('heading', { name: 'Welcome back' })

    await userEvent.type(screen.getByLabelText('Email or phone'), user.email)
    await userEvent.type(screen.getByLabelText('Password'), 'Secret@123')
    await userEvent.click(screen.getByRole('button', { name: 'Log in' }))

    await waitFor(() => expect(router.state.location.pathname).toBe('/patient'))
  })

  it('shows why the user was signed out, once', async () => {
    useAuthStore.getState().endSession('suspended')
    renderRoutes(routes, '/login')

    expect(await screen.findByText(/has been suspended/)).toBeInTheDocument()
    await waitFor(() => expect(useAuthStore.getState().signOutReason).toBeNull())
  })
})
