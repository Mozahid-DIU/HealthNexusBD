import { useAuthStore } from '@/stores/auth'
import type { ApiEnvelope } from '@/types/api'

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api'

/** Thrown on any non-successful response; carries the HTTP status + safe message. */
export class ApiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

type Method = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'

async function request<T>(
  method: Method,
  path: string,
  body?: unknown,
  allowRefresh = true,
): Promise<ApiEnvelope<T>> {
  const { accessToken } = useAuthStore.getState()

  const res = await fetch(BASE_URL + path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  })

  // Try a single silent refresh on 401, then retry the original request.
  if (res.status === 401 && allowRefresh) {
    const refreshed = await tryRefresh()
    if (refreshed) return request<T>(method, path, body, false)
  }

  const json = (await res.json().catch(() => null)) as ApiEnvelope<T> | null

  if (!res.ok || !json || !json.success) {
    throw new ApiError(json?.error ?? 'Something went wrong. Please try again.', res.status)
  }
  return json
}

async function tryRefresh(): Promise<boolean> {
  const { refreshToken, setAccessToken, clear } = useAuthStore.getState()
  if (!refreshToken) return false
  try {
    const res = await fetch(BASE_URL + '/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    })
    const json = (await res.json()) as ApiEnvelope<{ accessToken: string }>
    if (res.ok && json.success) {
      setAccessToken(json.data.accessToken)
      return true
    }
  } catch {
    // fall through to clear
  }
  clear()
  return false
}

/** Typed API client. Each method returns the parsed envelope; throws ApiError on failure. */
export const api = {
  get: <T>(path: string) => request<T>('GET', path),
  post: <T>(path: string, body?: unknown) => request<T>('POST', path, body),
  patch: <T>(path: string, body?: unknown) => request<T>('PATCH', path, body),
}

/** Multipart upload (lab report PDF). Returns the parsed envelope. */
export async function uploadFile<T>(path: string, form: FormData): Promise<ApiEnvelope<T>> {
  const { accessToken } = useAuthStore.getState()
  const res = await fetch(BASE_URL + path, {
    method: 'POST',
    headers: { ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}) },
    body: form,
  })
  const json = (await res.json().catch(() => null)) as ApiEnvelope<T> | null
  if (!res.ok || !json || !json.success) {
    throw new ApiError(json?.error ?? 'Upload failed', res.status)
  }
  return json
}
