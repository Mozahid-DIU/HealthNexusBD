import { useState } from 'react'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { CalendarClock, ChevronDown, Stethoscope } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { EmptyState, ErrorState, LoadingBlock } from '@/components/ui/Feedback'
import { Pagination } from '@/components/ui/Pagination'
import { AiSummaryCard, PrescriptionCard } from '@/features/clinical/ClinicalViews'
import { asList } from '@/features/patient/text'
import { useClampPage, usePageParam } from '@/features/patient/usePageParam'
import { useLanguage } from '@/i18n/useLanguage'
import { formatDate } from '@/lib/format'
import { doctorApi, doctorKeys } from './api'
import type { ChartRecord } from './types'

function RecordItem({ record }: { record: ChartRecord }) {
  const { t } = useTranslation()
  const lang = useLanguage()
  const [open, setOpen] = useState(false)
  const symptoms = asList(record.symptoms)
  const latestSummary = [...(record.aiSummaries ?? [])].sort((a, b) => b.generatedAt.localeCompare(a.generatedAt))[0]
  const panelId = `record-${record.id}`

  return (
    <li className="rounded-2xl border border-line bg-white shadow-card">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-4 rounded-2xl p-4 text-left transition hover:bg-surface-soft/60 focus-visible:outline-2 focus-visible:outline-brand sm:p-5"
      >
        <span className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand/[0.07] text-brand sm:flex">
          <Stethoscope aria-hidden className="h-5 w-5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[15px] font-bold text-ink">{record.diagnosis ?? '—'}</span>
          <span className="block truncate text-sm text-slate">
            {record.author?.fullName ?? '—'} · {formatDate(record.createdAt, lang)}
          </span>
          {record.followUpDate && (
            <span className="mt-1.5 inline-block">
              <Badge tone="warning">
                <CalendarClock aria-hidden className="h-3 w-3" />
                {formatDate(record.followUpDate, lang, { dateOnly: true })}
              </Badge>
            </span>
          )}
        </span>
        <ChevronDown aria-hidden className={`h-5 w-5 shrink-0 text-faint transition ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div id={panelId} className="space-y-5 border-t border-line px-4 py-5 sm:px-5">
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-faint">{t('clinical.note')}</p>
            <p className="whitespace-pre-line text-sm leading-relaxed text-body">{record.content}</p>
          </div>
          {symptoms.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-faint">{t('clinical.symptoms')}</p>
              <div className="flex flex-wrap gap-2">
                {symptoms.map((s) => (
                  <Badge key={s}>{s}</Badge>
                ))}
              </div>
            </div>
          )}
          {record.prescriptions.map((p) => (
            <div key={p.id}>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-faint">{t('clinical.prescription')}</p>
              <PrescriptionCard prescription={p} />
            </div>
          ))}
          {latestSummary && (
            <div className="rounded-xl border border-teal/30 p-4">
              <p className="mb-2 text-sm font-bold text-ink">{t('clinical.aiTitle')}</p>
              <AiSummaryCard summary={latestSummary} />
            </div>
          )}
        </div>
      )}
    </li>
  )
}

export function ChartRecords({ patientId }: { patientId: string }) {
  const { t } = useTranslation()
  const [page, setPage] = usePageParam()
  const records = useQuery({
    queryKey: doctorKeys.records(patientId, page),
    queryFn: () => doctorApi.records(patientId, page),
    placeholderData: keepPreviousData,
  })
  useClampPage(page, records.data?.meta, setPage)

  if (records.isPending) return <LoadingBlock lines={5} />
  if (records.isError) return <ErrorState error={records.error} onRetry={() => void records.refetch()} />
  if (records.data.data.length === 0) {
    return (
      <EmptyState
        icon={<Stethoscope aria-hidden className="h-6 w-6" />}
        title={t('doctor.chart.noRecords')}
        description={t('doctor.chart.noRecordsBody')}
      />
    )
  }
  return (
    <>
      <ul className="space-y-3">
        {records.data.data.map((r) => (
          <RecordItem key={r.id} record={r} />
        ))}
      </ul>
      {records.data.meta && <Pagination meta={records.data.meta} onPageChange={setPage} disabled={records.isFetching} />}
    </>
  )
}
