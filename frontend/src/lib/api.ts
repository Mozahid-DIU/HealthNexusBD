import { useAuthStore } from '@/stores/auth'
import type { ApiEnvelope } from '@/types/api'

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api'

/**
 * Stable codes from the backend (see backend/src/utils/AppError.ts), plus NETWORK for
 * requests that never got a response. Branch on these, never on message text.
 */
export type ApiErrorCode =
  | 'TOKEN_INVALID'
  | 'SESSION_INVALID'
  | 'ACCOUNT_SUSPENDED'
  | 'ACCOUNT_PENDING'
  | 'NETWORK'

/** Thrown on any failed request; carries the HTTP status (0 = no response) and code. */
export class ApiError extends Error {
  status: number
  code?: ApiErrorCode
  constructor(message: string, status: number, code?: ApiErrorCode) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
  }
}

type Method = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'

interface RequestOptions {
  body?: unknown
  form?: FormData
}

interface ErrorBody {
  error?: string | null
  code?: ApiErrorCode
}

async function send(method: Method, path: string, opts: RequestOptions, token: string | null) {
  const headers: Record<string, string> = {}
  if (token) headers.Authorization = `Bearer ${token}`
  let body: BodyInit | undefined
  if (opts.form) {
    body = opts.form // the browser sets the multipart boundary
  } else if (opts.body !== undefined) {
    headers['Content-Type'] = 'application/json'
    body = JSON.stringify(opts.body)
  }

  try {
    return await fetch(BASE_URL + path, { method, headers, body })
  } catch {
    throw new ApiError('errors.network', 0, 'NETWORK')
  }
}

async function readError(res: Response): Promise<ErrorBody> {
  return ((await res.json().catch(() => null)) as ErrorBody | null) ?? {}
}

// ---------------------------------------------------------------- token refresh

type RefreshOutcome =
  | { kind: 'ok' }
  | { kind: 'ended' } // the server ended this session; the store was signed out
  | { kind: 'stale' } // the session changed while refreshing (logout / another login)
  | { kind: 'offline' }
  | { kind: 'unavailable'; status: number } // 429 / 5xx: try again later, keep the session

let refreshing: { refreshToken: string; promise: Promise<RefreshOutcome> } | null = null

/** One refresh per session at a time: concurrent 401s all wait for the same attempt. */
function refreshOnce(refreshToken: string): Promise<RefreshOutcome> {
  if (refreshing?.refreshToken === refreshToken) return refreshing.promise
  const promise = doRefresh(refreshToken).finally(() => {
    if (refreshing?.promise === promise) refreshing = null
  })
  refreshing = { refreshToken, promise }
  return promise
}

/** Is `refreshToken` still the signed-in session? (It changes on logout and on every login.) */
function isCurrent(refreshToken: string | null): boolean {
  return refreshToken !== null && useAuthStore.getState().refreshToken === refreshToken
}

async function doRefresh(refreshToken: string): Promise<RefreshOutcome> {
  let res: Response
  try {
    res = await fetch(BASE_URL + '/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    })
  } catch {
    return { kind: 'offline' } // keep the session; the user may just be offline
  }

  const json = (await res.json().catch(() => null)) as
    | (ApiEnvelope<{ accessToken: string }> & ErrorBody)
    | null

  if (res.ok && json?.success && json.data?.accessToken) {
    if (!isCurrent(refreshToken)) return { kind: 'stale' }
    useAuthStore.getState().setAccessToken(json.data.accessToken)
    return { kind: 'ok' }
  }

  // Only a definite "this session is over" ends it. Rate limits, outages and proxy
  // error pages must not sign anyone out.
  const ended =
    (res.status === 401 || res.status === 403) &&
    (json?.code === 'SESSION_INVALID' || json?.code === 'ACCOUNT_SUSPENDED')
  if (!ended) return { kind: 'unavailable', status: res.status }
  if (!isCurrent(refreshToken)) return { kind: 'stale' }
  useAuthStore.getState().endSession(json?.code === 'ACCOUNT_SUSPENDED' ? 'suspended' : 'expired')
  return { kind: 'ended' }
}

function sessionOverError(): ApiError {
  return useAuthStore.getState().signOutReason === 'suspended'
    ? new ApiError('errors.accountSuspended', 403, 'ACCOUNT_SUSPENDED')
    : new ApiError('errors.sessionExpired', 401, 'SESSION_INVALID')
}

// ---------------------------------------------------------------- core

/**
 * Send a request with the current access token. If that token is stale
 * (TOKEN_INVALID), refresh once and retry. Session-ending errors sign the user out —
 * but only if the session that sent the request is still the signed-in one, so a late
 * response can never end (or leak into) a newer session.
 */
async function authorized(method: Method, path: string, opts: RequestOptions): Promise<Response> {
  const { accessToken: token, refreshToken: sessionRefresh } = useAuthStore.getState()
  // The session that sent this request is still the signed-in one.
  const stillCurrent = () =>
    sessionRefresh ? isCurrent(sessionRefresh) : useAuthStore.getState().accessToken === token
  let res = await send(method, path, opts, token)

  if (res.ok || !token) return res

  // Only a request that carried a session can end it (a failed login must not).
  const { code } = await readError(res.clone())
  if (res.status === 401 && code === 'TOKEN_INVALID') {
    if (!stillCurrent()) throw new ApiError('errors.sessionExpired', 401, 'SESSION_INVALID')
    if (!sessionRefresh) {
      // A session that can't be refreshed is over.
      useAuthStore.getState().endSession('expired')
      throw new ApiError('errors.sessionExpired', 401, 'SESSION_INVALID')
    }

    const latest = useAuthStore.getState().accessToken
    if (latest && latest !== token) {
      // Another request already refreshed this session; just retry with its token.
      res = await send(method, path, opts, latest)
    } else {
      const outcome = await refreshOnce(sessionRefresh)
      if (outcome.kind === 'offline') throw new ApiError('errors.network', 0, 'NETWORK')
      if (outcome.kind === 'unavailable') {
        throw new ApiError(outcome.status === 429 ? 'errors.rateLimited' : 'errors.generic', outcome.status)
      }
      if (outcome.kind === 'stale') throw new ApiError('errors.sessionExpired', 401, 'SESSION_INVALID')
      if (outcome.kind === 'ended') throw sessionOverError()
      res = await send(method, path, opts, useAuthStore.getState().accessToken)
    }
    if (res.ok) return res
  }

  if (stillCurrent()) {
    const err = await readError(res.clone())
    if (err.code === 'ACCOUNT_SUSPENDED') useAuthStore.getState().endSession('suspended')
    else if (err.code === 'SESSION_INVALID' || res.status === 401) {
      useAuthStore.getState().endSession('expired')
    }
  }
  return res
}

async function request<T>(method: Method, path: string, opts: RequestOptions = {}): Promise<ApiEnvelope<T>> {
  const res = await authorized(method, path, opts)
  const json = (await res.json().catch(() => null)) as (ApiEnvelope<T> & ErrorBody) | null

  if (!res.ok || !json || !json.success) {
    throw new ApiError(json?.error ?? 'errors.generic', res.status, json?.code)
  }
  return json
}

/** Download a protected file (e.g. a decrypted lab report PDF) as a Blob. */
async function blob(path: string): Promise<Blob> {
  const res = await authorized('GET', path, {})
  if (!res.ok) {
    const err = await readError(res)
    throw new ApiError(err.error ?? 'errors.generic', res.status, err.code)
  }
  return res.blob()
}

/** Typed API client. Each method returns the parsed envelope; throws ApiError on failure. */
export const api = {
  get: <T>(path: string) => request<T>('GET', path),
  post: <T>(path: string, body?: unknown) => request<T>('POST', path, { body }),
  patch: <T>(path: string, body?: unknown) => request<T>('PATCH', path, { body }),
  blob,
}

/** Multipart upload (lab report PDF). Same refresh and error handling as `api`. */
export function uploadFile<T>(path: string, form: FormData): Promise<ApiEnvelope<T>> {
  return request<T>('POST', path, { form })
}
