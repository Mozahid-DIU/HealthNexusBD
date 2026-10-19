import { useTranslation } from 'react-i18next'
import { translateApiError } from '@/lib/errors'

/** Renders a friendly, translated, safe message for a failed request. */
export function FormError({ error }: { error: unknown }) {
  const { t } = useTranslation()
  if (!error) return null
  return (
    <div
      role="alert"
      className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600"
    >
      {translateApiError(error, t)}
    </div>
  )
}
