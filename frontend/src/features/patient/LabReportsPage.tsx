import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { BadgeCheck, FlaskConical } from 'lucide-react'
import { ReportFileActions } from '@/components/files/ReportFileActions'
import { PageHeader } from '@/components/layout/dashboard/PageHeader'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { EmptyState, ErrorState, LoadingBlock } from '@/components/ui/Feedback'
import { Pagination } from '@/components/ui/Pagination'
import { useLanguage } from '@/i18n/useLanguage'
import { formatDate } from '@/lib/format'
import { patientApi, patientKeys } from './api'
import { useClampPage, usePageParam } from './usePageParam'

export function LabReportsPage() {
  const { t } = useTranslation()
  const lang = useLanguage()
  const [page, setPage] = usePageParam()
  const reports = useQuery({
    queryKey: patientKeys.labReports(page),
    queryFn: () => patientApi.labReports(page),
    placeholderData: keepPreviousData,
  })
  useClampPage(page, reports.data?.meta, setPage)

  return (
    <>
      <PageHeader title={t('patient.lab.title')} description={t('patient.lab.subtitle')} />
      {reports.isPending ? (
        <Card>
          <LoadingBlock lines={5} />
        </Card>
      ) : reports.isError ? (
        <Card>
          <ErrorState error={reports.error} onRetry={() => void reports.refetch()} />
        </Card>
      ) : reports.data.data.length === 0 ? (
        <Card>
          <EmptyState
            icon={<FlaskConical aria-hidden className="h-6 w-6" />}
            title={t('patient.lab.empty')}
            description={t('patient.lab.emptyBody')}
          />
        </Card>
      ) : (
        <>
          <ul className="space-y-3">
            {reports.data.data.map((report) => (
              <li
                key={report.id}
                className="flex flex-col gap-4 rounded-2xl border border-line bg-white p-4 shadow-card sm:flex-row sm:items-center sm:p-5"
              >
                <span className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-teal/10 text-teal sm:flex">
                  <FlaskConical aria-hidden className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-2 text-[15px] font-bold text-ink">
                    <span className="truncate">{report.testName}</span>
                    {report.isVerified && (
                      <Badge tone="success">
                        <BadgeCheck aria-hidden className="h-3 w-3" />
                        {t('patient.lab.verified')}
                      </Badge>
                    )}
                  </p>
                  <p className="mt-0.5 text-sm text-slate">
                    {t('patient.lab.from', { lab: report.lab })} ·{' '}
                    {t('patient.lab.uploaded', { date: formatDate(report.uploadedAt, lang) })}
                  </p>
                </div>
                <ReportFileActions title={report.testName} fetchFile={() => patientApi.labReportFile(report)} />
              </li>
            ))}
          </ul>
          {reports.data.meta && (
            <Pagination meta={reports.data.meta} onPageChange={setPage} disabled={reports.isFetching} />
          )}
        </>
      )}
    </>
  )
}
