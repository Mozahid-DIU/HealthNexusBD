import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { RotateCw, Sparkles, TriangleAlert } from 'lucide-react'
import { LoadingBlock } from '@/components/ui/Feedback'
import { useLanguage } from '@/i18n/useLanguage'
import { formatDateTime, formatNumber } from '@/lib/format'
import { doctorApi, doctorKeys } from './api'

/** The answer stays valid until the history changes; a new visit invalidates it. */
const STALE_MS = 5 * 60 * 1000

/**
 * UC-06: the moment consent opens the chart, an AI briefing on the whole history, so the
 * doctor sees the pattern before reading individual visits. Advisory only.
 */
export function AiOverviewCard({ patientId }: { patientId: string }) {
  const { t } = useTranslation()
  const lang = useLanguage()
  const overview = useQuery({
    queryKey: doctorKeys.aiOverview(patientId),
    queryFn: () => doctorApi.aiOverview(patientId),
    select: (res) => res.data,
    staleTime: STALE_MS,
  })

  return (
    <section
      aria-labelledby="ai-overview-title"
      aria-busy={overview.isPending}
      className="relative mb-6 overflow-hidden rounded-2xl border border-brand/15 bg-gradient-to-br from-[#f2f8ff] via-white to-[#effaf9] p-5 shadow-card sm:p-6"
    >
      <span aria-hidden className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-brand to-teal" />
      <div className="mb-3 flex items-center gap-2.5">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand to-teal text-white">
          <Sparkles aria-hidden className="h-4 w-4" />
        </span>
        <h2 id="ai-overview-title" className="text-base font-bold text-ink">
          {t('doctor.overview.title')}
        </h2>
      </div>

      {overview.isPending && (
        <div className="space-y-3">
          <p className="text-sm text-slate">{t('doctor.overview.loading')}</p>
          <LoadingBlock lines={3} />
        </div>
      )}

      {overview.isError && (
        <div className="flex flex-wrap items-center gap-3 text-sm text-slate">
          <span>{t('doctor.overview.failed')}</span>
          <button
            type="button"
            onClick={() => void overview.refetch()}
            className="inline-flex items-center gap-1.5 rounded-lg font-semibold text-brand hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          >
            <RotateCw aria-hidden className="h-3.5 w-3.5" />
            {t('doctor.overview.retry')}
          </button>
        </div>
      )}

      {overview.data && (
        <>
          <p className="whitespace-pre-line text-[15px] leading-relaxed text-body">{overview.data.summary}</p>

          {overview.data.alerts.length > 0 && (
            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3.5">
              <p className="mb-1.5 flex items-center gap-2 text-sm font-bold text-amber-800">
                <TriangleAlert aria-hidden className="h-4 w-4" />
                {t('doctor.overview.watch')}
              </p>
              <ul className="list-disc space-y-1 pl-5 text-sm text-amber-900">
                {overview.data.alerts.map((alert, i) => (
                  <li key={i}>{alert}</li>
                ))}
              </ul>
            </div>
          )}

          <p className="mt-4 text-xs text-slate">
            {overview.data.visitCount === 1
              ? t('doctor.overview.visitsOne')
              : t('doctor.overview.visits', { count: formatNumber(overview.data.visitCount, lang) })}
            {' · '}
            {t('clinical.aiDisclaimer')}
            {' · '}
            {formatDateTime(overview.data.generatedAt, lang)}
          </p>
          {overview.data.model.startsWith('demo') && (
            <p className="mt-1 text-xs text-slate">{t('doctor.overview.offline')}</p>
          )}
        </>
      )}
    </section>
  )
}
