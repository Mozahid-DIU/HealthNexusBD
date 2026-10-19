import { useTranslation } from 'react-i18next'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useLanguage } from '@/i18n/useLanguage'
import { formatNumber } from '@/lib/format'
import type { PaginationMeta } from '@/types/api'

interface PaginationProps {
  meta: PaginationMeta
  onPageChange: (page: number) => void
  disabled?: boolean
}

/** Previous / "Page x of y" / Next. Renders nothing when everything fits on one page. */
export function Pagination({ meta, onPageChange, disabled = false }: PaginationProps) {
  const { t } = useTranslation()
  const lang = useLanguage()
  const pages = Math.max(1, Math.ceil(meta.total / Math.max(1, meta.limit)))
  if (pages <= 1) return null
  const page = Math.min(Math.max(1, meta.page), pages)

  const btn =
    'inline-flex h-9 items-center gap-1 rounded-lg px-3 text-sm font-semibold text-slate ring-1 ring-line transition hover:text-brand disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-brand'

  return (
    <nav aria-label={t('ui.pagination')} className="flex items-center justify-between gap-3 pt-4">
      <button type="button" className={btn} disabled={disabled || page <= 1} onClick={() => onPageChange(page - 1)}>
        <ChevronLeft aria-hidden className="h-4 w-4" />
        {t('common.previous')}
      </button>
      <span className="text-sm text-slate" aria-live="polite">
        {t('common.pageOf', { page: formatNumber(page, lang), pages: formatNumber(pages, lang) })}
      </span>
      <button type="button" className={btn} disabled={disabled || page >= pages} onClick={() => onPageChange(page + 1)}>
        {t('common.next')}
        <ChevronRight aria-hidden className="h-4 w-4" />
      </button>
    </nav>
  )
}
