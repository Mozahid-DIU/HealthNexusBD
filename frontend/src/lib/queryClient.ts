import { QueryClient } from '@tanstack/react-query'

/** HTTP status of an ApiError-like value (duck-typed to avoid an import cycle with api.ts). */
function statusOf(error: unknown): number | undefined {
  return typeof error === 'object' && error !== null && 'status' in error && typeof error.status === 'number'
    ? error.status
    : undefined
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Retry once for network blips and 5xx; a 4xx (auth, not found, validation) won't
      // change on retry, and retrying after a sign-out would only flash a second error.
      retry: (failureCount, error) => {
        const status = statusOf(error)
        if (status !== undefined && status >= 400 && status < 500) return false
        return failureCount < 1
      },
      refetchOnWindowFocus: false,
      staleTime: 30_000,
    },
  },
})
