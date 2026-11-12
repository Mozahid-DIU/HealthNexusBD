import { vi } from 'vitest'

export interface Call {
  method: string
  path: string
  /** The query string, parsed (routes match on `path` alone). */
  query: URLSearchParams
  body: unknown
}

type Reply = { status?: number; body?: unknown; blob?: string }
type Handler = Reply | ((call: Call) => Reply | Promise<Reply>)

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

/** `{ success, data, error, meta? }` the way the backend sends it. */
export const envelope = (data: unknown, meta?: { total: number; page: number; limit: number }) => ({
  success: true,
  data,
  error: null,
  ...(meta ? { meta } : {}),
})

/**
 * A fake backend for page tests. Keys are "METHOD /path" with the query string ignored
 * (e.g. "GET /patient/records"). Unmatched requests fail loudly with a 404.
 */
export function mockApi(routes: Record<string, Handler>) {
  const calls: Call[] = []
  const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = new URL(String(input))
    const path = url.pathname.replace(/^\/api/, '')
    const method = (init?.method ?? 'GET').toUpperCase()
    const body = typeof init?.body === 'string' ? JSON.parse(init.body) : init?.body
    const call = { method, path, query: url.searchParams, body }
    calls.push(call)
    const handler = routes[`${method} ${path}`]
    if (!handler) return json(404, { success: false, data: null, error: `unmocked ${method} ${path}` })
    const reply = typeof handler === 'function' ? await handler(call) : handler
    if (reply.blob !== undefined) {
      return new Response(reply.blob, { status: reply.status ?? 200, headers: { 'Content-Type': 'application/pdf' } })
    }
    return json(reply.status ?? 200, reply.body ?? envelope(null))
  })
  vi.stubGlobal('fetch', fetchMock)
  return { calls, fetchMock }
}
