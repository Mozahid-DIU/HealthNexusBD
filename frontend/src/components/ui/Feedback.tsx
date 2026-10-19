import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Inbox, LoaderCircle, RefreshCw, TriangleAlert } from 'lucide-react'
import { translateApiError } from '@/lib/errors'
import { Button } from './Button'

/** Inline spinner with an accessible label. */
export function Spinner({ label, className = '' }: { label?: string; className?: string }) {
  const { t } = useTranslation()
  return (
    <span role="status" className={`inline-flex items-center gap-2 text-sm text-slate ${className}`}>
      <LoaderCircle aria-hidden className="h-4 w-4 animate-spin text-brand" />
      <span>{label ?? t('common.loading')}</span>
    </span>
  )
}

/** Placeholder block while content loads. Decorative; pair with a labelled region. */
export function Skeleton({ className = '' }: { className?: string }) {
  return <span aria-hidden className={`block animate-pulse rounded-lg bg-slate-200/70 ${className}`} />
}

/** A labelled loading region made of skeleton lines. */
export function LoadingBlock({ lines = 3 }: { lines?: number }) {
  const { t } = useTranslation()
  return (
    <div role="status" aria-label={t('ui.loadingContent')} className="space-y-3">
      {Array.from({ length: lines }, (_, i) => (
        <Skeleton key={i} className={`h-4 ${i === lines - 1 ? 'w-2/3' : 'w-full'}`} />
      ))}
    </div>
  )
}

interface EmptyStateProps {
  title: ReactNode
  description?: ReactNode
  icon?: ReactNode
  action?: ReactNode
}

export function EmptyState({ title, description, icon, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center px-6 py-10 text-center">
      <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand/[0.07] text-brand">
        {icon ?? <Inbox aria-hidden className="h-6 w-6" />}
      </span>
      <p className="text-sm font-bold text-ink">{title}</p>
      {description && <p className="mt-1 max-w-sm text-sm text-slate">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

interface ErrorStateProps {
  error: unknown
  onRetry?: () => void
  /** Overrides the translated error message. */
  title?: ReactNode
}

/** A failed load, with the translated reason and an optional retry. */
export function ErrorState({ error, onRetry, title }: ErrorStateProps) {
  const { t } = useTranslation()
  return (
    <div role="alert" className="flex flex-col items-center px-6 py-10 text-center">
      <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-500">
        <TriangleAlert aria-hidden className="h-6 w-6" />
      </span>
      <p className="max-w-sm text-sm font-semibold text-ink">{title ?? translateApiError(error, t)}</p>
      {onRetry && (
        <Button variant="outline" size="sm" className="mt-5" onClick={onRetry}>
          <RefreshCw aria-hidden className="h-4 w-4" />
          {t('common.retry')}
        </Button>
      )}
    </div>
  )
}
