import type { ReactElement } from 'react'
import { render } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createMemoryRouter, RouterProvider, type RouteObject } from 'react-router-dom'

/** Fresh query client per test: no retries, so failures surface immediately. */
export function testQueryClient() {
  return new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
}

/** Render a page inside a memory router (at `path`) with React Query. */
export function renderPage(ui: ReactElement, { path = '/', routes = [] as RouteObject[] } = {}) {
  const client = testQueryClient()
  const router = createMemoryRouter([{ path, element: ui }, ...routes], { initialEntries: [path] })
  return { client, router, ...render(<QueryClientProvider client={client}><RouterProvider router={router} /></QueryClientProvider>) }
}

/** Render a whole route tree starting at `initialPath`. */
export function renderRoutes(routes: RouteObject[], initialPath: string) {
  const client = testQueryClient()
  const router = createMemoryRouter(routes, { initialEntries: [initialPath] })
  return { client, router, ...render(<QueryClientProvider client={client}><RouterProvider router={router} /></QueryClientProvider>) }
}
