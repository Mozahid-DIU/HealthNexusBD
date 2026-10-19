import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError, api, uploadFile } from '../api'
import { queryClient } from '../queryClient'
import { useAuthStore } from '@/stores/auth'
import type { AuthUser } from '@/types/api'

const USER: AuthUser = { id: 'u1', email: 'a@b.bd', phone: '01711111111', role: 'patient', status: 'active' }

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
const ok = <T>(data: T) => json(200, { success: true, data, error: null })
const fail = (status: number, error: string, code?: string) =>
  json(status, { success: false, data: null, error, ...(code ? { code } : {}) })

function signIn(accessToken = 'old-access', refreshToken = 'refresh-1') {
  useAuthStore.getState().setAuth(USER, accessToken, refreshToken)
}

type Handler = (url: string, init: RequestInit) => Response | Promise<Response>
function mockFetch(handler: Handler) {
  const fn = vi.fn((input: RequestInfo | URL, init?: RequestInit) =>
    Promise.resolve(handler(String(input), init ?? {})),
  )
  vi.stubGlobal('fetch', fn)
  return fn
}
const authHeader = (init: RequestInit) => (init.headers as Record<string, string> | undefined)?.Authorization

beforeEach(() => {
  vi.unstubAllGlobals()
})

describe('api client', () => {
  it('sends JSON with the bearer token and returns the envelope', async () => {
    signIn()
    const fetchMock = mockFetch(() => ok({ hello: 'world' }))

    const res = await api.post<{ hello: string }>('/x', { a: 1 })

    expect(res.data.hello).toBe('world')
    const [, init] = fetchMock.mock.calls[0]
    expect(authHeader(init!)).toBe('Bearer old-access')
    expect(init!.body).toBe('{"a":1}')
  })

  it('refreshes a stale token once and retries the request', async () => {
    signIn()
    const fetchMock = mockFetch((url, init) => {
      if (url.endsWith('/auth/refresh')) return ok({ accessToken: 'new-access' })
      return authHeader(init) === 'Bearer new-access' ? ok('fresh') : fail(401, 'Invalid or expired token', 'TOKEN_INVALID')
    })

    const res = await api.get<string>('/me')

    expect(res.data).toBe('fresh')
    expect(useAuthStore.getState().accessToken).toBe('new-access')
    expect(fetchMock.mock.calls.filter(([u]) => String(u).endsWith('/auth/refresh'))).toHaveLength(1)
  })

  it('shares one refresh between concurrent requests', async () => {
    signIn()
    const fetchMock = mockFetch(async (url, init) => {
      if (url.endsWith('/auth/refresh')) {
        await new Promise((r) => setTimeout(r, 20))
        return ok({ accessToken: 'new-access' })
      }
      return authHeader(init) === 'Bearer new-access' ? ok(url) : fail(401, 'expired', 'TOKEN_INVALID')
    })

    await Promise.all([api.get('/a'), api.get('/b'), api.get('/c')])

    expect(fetchMock.mock.calls.filter(([u]) => String(u).endsWith('/auth/refresh'))).toHaveLength(1)
  })

  it('ends the session as "expired" when the refresh token is rejected', async () => {
    signIn()
    mockFetch((url) =>
      url.endsWith('/auth/refresh') ? fail(401, 'Session is no longer valid.', 'SESSION_INVALID') : fail(401, 'expired', 'TOKEN_INVALID'),
    )

    await expect(api.get('/me')).rejects.toMatchObject({ status: 401, code: 'SESSION_INVALID' })
    expect(useAuthStore.getState()).toMatchObject({ accessToken: null, user: null, signOutReason: 'expired' })
  })

  it('ends the session as "suspended" on ACCOUNT_SUSPENDED (no refresh attempt)', async () => {
    signIn()
    const fetchMock = mockFetch(() => fail(403, 'suspended', 'ACCOUNT_SUSPENDED'))

    await expect(api.get('/me')).rejects.toMatchObject({ code: 'ACCOUNT_SUSPENDED' })
    expect(useAuthStore.getState().signOutReason).toBe('suspended')
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('ends the session as "suspended" when the refresh says so', async () => {
    signIn()
    mockFetch((url) =>
      url.endsWith('/auth/refresh') ? fail(403, 'Account suspended', 'ACCOUNT_SUSPENDED') : fail(401, 'expired', 'TOKEN_INVALID'),
    )

    await expect(api.get('/me')).rejects.toMatchObject({ code: 'ACCOUNT_SUSPENDED' })
    expect(useAuthStore.getState().signOutReason).toBe('suspended')
  })

  it('ends the session on SESSION_INVALID without trying to refresh', async () => {
    signIn()
    const fetchMock = mockFetch(() => fail(401, 'Session is no longer valid.', 'SESSION_INVALID'))

    await expect(api.get('/me')).rejects.toBeInstanceOf(ApiError)
    expect(useAuthStore.getState().signOutReason).toBe('expired')
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('never touches the session for a failed login (no token was sent)', async () => {
    const fetchMock = mockFetch(() => fail(401, 'Invalid credentials'))

    await expect(api.post('/auth/login', {})).rejects.toMatchObject({ status: 401, message: 'Invalid credentials' })
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(useAuthStore.getState().signOutReason).toBeNull()
  })

  it('keeps the session for ordinary errors like 403 pending or 404', async () => {
    signIn()
    mockFetch((url) => (url.endsWith('/pending') ? fail(403, 'pending', 'ACCOUNT_PENDING') : fail(404, 'Not found')))

    await expect(api.get('/pending')).rejects.toMatchObject({ code: 'ACCOUNT_PENDING' })
    await expect(api.get('/missing')).rejects.toMatchObject({ status: 404 })
    expect(useAuthStore.getState().accessToken).toBe('old-access')
  })

  it('reports a network failure as NETWORK and keeps the session', async () => {
    signIn()
    vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new TypeError('Failed to fetch'))))

    await expect(api.get('/me')).rejects.toMatchObject({ status: 0, code: 'NETWORK' })
    expect(useAuthStore.getState().accessToken).toBe('old-access')
  })

  it('keeps the session when the refresh itself cannot reach the server', async () => {
    signIn()
    vi.stubGlobal(
      'fetch',
      vi.fn((input: RequestInfo | URL) =>
        String(input).endsWith('/auth/refresh')
          ? Promise.reject(new TypeError('offline'))
          : Promise.resolve(fail(401, 'expired', 'TOKEN_INVALID')),
      ),
    )

    await expect(api.get('/me')).rejects.toMatchObject({ code: 'NETWORK' })
    expect(useAuthStore.getState().refreshToken).toBe('refresh-1')
  })

  it('uploads multipart without forcing a JSON content type, and refreshes like any request', async () => {
    signIn()
    const fetchMock = mockFetch((url, init) => {
      if (url.endsWith('/auth/refresh')) return ok({ accessToken: 'new-access' })
      return authHeader(init) === 'Bearer new-access' ? ok({ id: 'r1' }) : fail(401, 'expired', 'TOKEN_INVALID')
    })
    const form = new FormData()
    form.append('testName', 'CBC')

    const res = await uploadFile<{ id: string }>('/lab/reports', form)

    expect(res.data.id).toBe('r1')
    const last = fetchMock.mock.calls.at(-1)![1]!
    expect(last.body).toBe(form)
    expect((last.headers as Record<string, string>)['Content-Type']).toBeUndefined()
  })

  it('downloads a protected file as a Blob, and surfaces the server error otherwise', async () => {
    signIn()
    mockFetch((url) =>
      url.endsWith('/ok.pdf')
        ? new Response('%PDF-1.4', { status: 200, headers: { 'Content-Type': 'application/pdf' } })
        : fail(404, 'Lab report not found'),
    )

    const file = await api.blob('/ok.pdf')
    expect(file.type).toBe('application/pdf')
    expect(await file.text()).toBe('%PDF-1.4')
    await expect(api.blob('/missing.pdf')).rejects.toMatchObject({ status: 404, message: 'Lab report not found' })
  })
})

describe('api client: resilience (review fixes)', () => {
  it.each([429, 502, 503])('keeps the session when the refresh endpoint answers %i', async (status) => {
    signIn()
    mockFetch((url) =>
      url.endsWith('/auth/refresh') ? fail(status, 'Too many attempts') : fail(401, 'expired', 'TOKEN_INVALID'),
    )

    await expect(api.get('/me')).rejects.toMatchObject({ status })
    expect(useAuthStore.getState()).toMatchObject({ accessToken: 'old-access', refreshToken: 'refresh-1', signOutReason: null })
  })

  it('keeps the session when the refresh returns a non-JSON error page', async () => {
    signIn()
    mockFetch((url) =>
      url.endsWith('/auth/refresh') ? new Response('<html>Bad gateway</html>', { status: 502 }) : fail(401, 'x', 'TOKEN_INVALID'),
    )

    await expect(api.get('/me')).rejects.toMatchObject({ status: 502 })
    expect(useAuthStore.getState().refreshToken).toBe('refresh-1')
  })

  it("ignores a previous user's late SESSION_INVALID after someone else signed in", async () => {
    signIn('a-access', 'a-refresh')
    let release!: () => void
    const gate = new Promise<void>((r) => (release = r))
    mockFetch(async () => {
      await gate
      return fail(401, 'Session is no longer valid.', 'SESSION_INVALID')
    })

    const inFlight = api.get('/records')
    useAuthStore.getState().clear()
    signIn('b-access', 'b-refresh')
    release()

    await expect(inFlight).rejects.toBeInstanceOf(ApiError)
    expect(useAuthStore.getState()).toMatchObject({ accessToken: 'b-access', refreshToken: 'b-refresh', signOutReason: null })
  })

  it("never writes a previous user's refreshed token into a new session", async () => {
    signIn('a-access', 'a-refresh')
    let release!: () => void
    const gate = new Promise<void>((r) => (release = r))
    mockFetch(async (url) => {
      if (url.endsWith('/auth/refresh')) {
        await gate
        return ok({ accessToken: 'a-new-access' })
      }
      return fail(401, 'expired', 'TOKEN_INVALID')
    })

    const inFlight = api.get('/records').catch(() => undefined)
    await new Promise((r) => setTimeout(r, 0))
    useAuthStore.getState().clear()
    signIn('b-access', 'b-refresh')
    release()
    await inFlight

    expect(useAuthStore.getState().accessToken).toBe('b-access')
  })

  it('signs out a token-only session (no refresh token) instead of failing forever', async () => {
    useAuthStore.setState({ user: USER, accessToken: 'orphan', refreshToken: null })
    mockFetch(() => fail(401, 'expired', 'TOKEN_INVALID'))

    await expect(api.get('/me')).rejects.toMatchObject({ code: 'SESSION_INVALID' })
    expect(useAuthStore.getState()).toMatchObject({ accessToken: null, signOutReason: 'expired' })
  })

  it('does not show "session expired" after a deliberate logout', async () => {
    signIn()
    let release!: () => void
    const gate = new Promise<void>((r) => (release = r))
    mockFetch(async () => {
      await gate
      return fail(401, 'Session is no longer valid.', 'SESSION_INVALID')
    })

    const inFlight = api.get('/records').catch(() => undefined)
    useAuthStore.getState().clear()
    release()
    await inFlight

    expect(useAuthStore.getState().signOutReason).toBeNull()
  })
})

describe('auth store', () => {
  it('drops cached server data whenever the identity changes', () => {
    queryClient.setQueryData(['records'], ['private'])
    signIn()
    expect(queryClient.getQueryData(['records'])).toBeUndefined()

    queryClient.setQueryData(['records'], ['private'])
    useAuthStore.getState().clear()
    expect(queryClient.getQueryData(['records'])).toBeUndefined()

    queryClient.setQueryData(['records'], ['private'])
    useAuthStore.getState().endSession('expired')
    expect(queryClient.getQueryData(['records'])).toBeUndefined()
  })

  it('ignores a late profile or token for a session that has ended', () => {
    signIn()
    useAuthStore.getState().clear()

    useAuthStore.getState().setUser(USER)
    useAuthStore.getState().setAccessToken('late')

    expect(useAuthStore.getState()).toMatchObject({ user: null, accessToken: null })
  })

  it("never swaps in another user's profile", () => {
    signIn()
    useAuthStore.getState().setUser({ ...USER, id: 'someone-else' })
    expect(useAuthStore.getState().user?.id).toBe('u1')
  })

  it('follows a sign-out or sign-in made in another tab', async () => {
    signIn()
    queryClient.setQueryData(['records'], ['private'])
    const other = { state: { user: { ...USER, id: 'u2' }, accessToken: 'b', refreshToken: 'rb' }, version: 0 }
    localStorage.setItem('healthnexus-auth', JSON.stringify(other))

    window.dispatchEvent(new StorageEvent('storage', { key: 'healthnexus-auth' }))
    await new Promise((r) => setTimeout(r, 0))

    expect(useAuthStore.getState()).toMatchObject({ accessToken: 'b', user: { id: 'u2' } })
    expect(queryClient.getQueryData(['records'])).toBeUndefined()
  })

  it('persists the session but not the one-off sign-out reason', () => {
    signIn()
    useAuthStore.getState().endSession('suspended')
    signIn('a2', 'r2')

    const saved = JSON.parse(localStorage.getItem('healthnexus-auth') ?? '{}')
    expect(saved.state).toEqual({ user: USER, accessToken: 'a2', refreshToken: 'r2' })
  })
})
