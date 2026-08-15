import { ApiError } from '@/lib/api'

/** Renders a friendly, safe message for a failed mutation. */
export function FormError({ error }: { error: unknown }) {
  if (!error) return null
  const message =
    error instanceof ApiError
      ? error.message
      : error instanceof Error
        ? error.message
        : 'Something went wrong. Please try again.'
  return (
    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
      {message}
    </div>
  )
}
