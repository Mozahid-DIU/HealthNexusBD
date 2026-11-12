import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { CalendarClock, ChevronRight, Pill, Stethoscope } from 'lucide-react'
import { PageHeader } from '@/components/layout/dashboard/PageHeader'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { EmptyState, ErrorState, LoadingBlock } from '@/components/ui/Feedback'
import { Pagination } from '@/components/ui/Pagination'
import { useLanguage } from '@/i18n/useLanguage'
import { formatDate, formatNumber } from '@/lib/format'
import { patientApi, patientKeys } from './api'
import { useClampPage, usePageParam } from '@/lib/usePageParam'

export function RecordsPage() {
  const { t } = useTranslation()
  const lang = useLanguage()
  const [page, setPage] = usePageParam()
  const records = useQuery({
    queryKey: patientKeys.records(page),
    queryFn: () => patientApi.records(page),
    placeholderData: keepPreviousData,
  })
  useClampPage(page, records.data?.meta, setPage)

  return (
    <>
      <PageHeader title={t('patient.records.title')} description={t('patient.records.subtitle')} />
      {records.isPending ? (
        <Card>
          <LoadingBlock lines={5} />
        </Card>
      ) : records.isError ? (
        <Card>
          <ErrorState error={records.error} onRetry={() => void records.refetch()} />
        </Card>
      ) : records.data.data.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Stethoscope aria-hidden className="h-6 w-6" />}
            title={t('patient.records.empty')}
            description={t('patient.records.emptyBody')}
          />
        </Card>
      ) : (
        <>
          <ul className="space-y-3">
            {records.data.data.map((r) => {
              const medicines = r.prescriptions.reduce(
                (n, p) => n + (Array.isArray(p.medications) ? p.medications.length : 0),
                0,
              )
              return (
                <li key={r.id}>
                  <Link
                    to={`/patient/records/${r.id}`}
                    className="group flex items-center gap-4 rounded-2xl border border-line bg-white p-4 shadow-card transition hover:-translate-y-0.5 hover:shadow-soft focus-visible:outline-2 focus-visible:outline-brand sm:p-5"
                  >
                    <span className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand/[0.07] text-brand sm:flex">
                      <Stethoscope aria-hidden className="h-5 w-5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[15px] font-bold text-ink">
                        {r.diagnosis ?? t('patient.records.untitled')}
                      </span>
                      <span className="mt-0.5 block truncate text-sm text-slate">
                        {t('patient.records.by', { name: r.doctor?.fullName ?? t('patient.records.unknownDoctor') })}
                        {r.doctor?.specialization ? ` · ${r.doctor.specialization}` : ''} · {formatDate(r.createdAt, lang)}
                      </span>
                      <span className="mt-2 flex flex-wrap gap-2">
                        {medicines > 0 && (
                          <Badge tone="teal">
                            <Pill aria-hidden className="h-3 w-3" />
                            {t('patient.records.medicines', { count: formatNumber(medicines, lang) })}
                          </Badge>
                        )}
                        {r.followUpDate && (
                          <Badge tone="warning">
                            <CalendarClock aria-hidden className="h-3 w-3" />
                            {t('patient.records.followUp', { date: formatDate(r.followUpDate, lang, { dateOnly: true }) })}
                          </Badge>
                        )}
                      </span>
                    </span>
                    <ChevronRight aria-hidden className="h-5 w-5 shrink-0 text-faint transition group-hover:text-brand" />
                  </Link>
                </li>
              )
            })}
          </ul>
          {records.data.meta && (
            <Pagination meta={records.data.meta} onPageChange={setPage} disabled={records.isFetching} />
          )}
        </>
      )}
    </>
  )
}
