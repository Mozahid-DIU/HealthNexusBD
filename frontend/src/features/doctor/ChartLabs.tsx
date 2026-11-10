import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { BadgeCheck, FlaskConical } from 'lucide-react'
import { ReportFileActions } from '@/components/files/ReportFileActions'
import { Badge } from '@/components/ui/Badge'
import { EmptyState, ErrorState, LoadingBlock } from '@/components/ui/Feedback'
import { Pagination } from '@/components/ui/Pagination'
import { useLanguage } from '@/i18n/useLanguage'
import { formatDate } from '@/lib/format'
import { doctorApi, doctorKeys } from './api'

export function ChartLabs({ patientId }: { patientId: string }) {
  const { t } = useTranslation()
  const lang = useLanguage()
  // Local page state: the chart's URL page belongs to the records tab.
  const [page, setPage] = useState(1)
  const reports = useQuery({
    queryKey: doctorKeys.labs(patientId, page),
    queryFn: () => doctorApi.labReports(patientId, page),
    placeholderData: keepPreviousData,
  })

  if (reports.isPending) return <LoadingBlock lines={4} />
  if (reports.isError) return <ErrorState error={reports.error} onRetry={() => void reports.refetch()} />
  if (reports.data.data.length === 0) {
    return <EmptyState icon={<FlaskConical aria-hidden className="h-6 w-6" />} title={t('doctor.chart.noLabs')} />
  }
  return (
    <>
      <ul className="space-y-3">
        {reports.data.data.map((report) => (
          <li
            key={report.id}
            className="flex flex-col gap-4 rounded-2xl border border-line bg-white p-4 shadow-card sm:flex-row sm:items-center"
          >
            <div className="min-w-0 flex-1">
              <p className="flex flex-wrap items-center gap-2 text-[15px] font-bold text-ink">
                <span className="truncate">{report.testName}</span>
                {report.isVerified && (
                  <Badge tone="success">
                    <BadgeCheck aria-hidden className="h-3 w-3" />
                    {t('files.verified')}
                  </Badge>
                )}
              </p>
              <p className="mt-0.5 text-sm text-slate">
                {t('files.from', { lab: report.lab })} · {t('files.uploaded', { date: formatDate(report.uploadedAt, lang) })}
              </p>
            </div>
            <ReportFileActions title={report.testName} fetchFile={() => doctorApi.labReportFile(patientId, report.id)} />
          </li>
        ))}
      </ul>
      {reports.data.meta && <Pagination meta={reports.data.meta} onPageChange={setPage} disabled={reports.isFetching} />}
    </>
  )
}
