import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { ScrollText } from 'lucide-react'
import { PageHeader } from '@/components/layout/dashboard/PageHeader'
import { Badge, type BadgeTone } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { EmptyState, ErrorState, LoadingBlock } from '@/components/ui/Feedback'
import { Pagination } from '@/components/ui/Pagination'
import { useLanguage } from '@/i18n/useLanguage'
import { formatDateTime } from '@/lib/format'
import { patientApi, patientKeys } from './api'
import { auditDescription } from './text'
import type { AuditEntry } from './types'
import { useClampPage, usePageParam } from './usePageParam'

const ROLE_TONE: Record<AuditEntry['role'], BadgeTone> = {
  doctor: 'brand',
  lab: 'teal',
  admin: 'warning',
  patient: 'neutral',
}

export function AuditPage() {
  const { t } = useTranslation()
  const lang = useLanguage()
  const [page, setPage] = usePageParam()
  const audit = useQuery({
    queryKey: patientKeys.audit(page),
    queryFn: () => patientApi.audit(page),
    placeholderData: keepPreviousData,
  })
  useClampPage(page, audit.data?.meta, setPage)

  return (
    <>
      <PageHeader title={t('patient.audit.title')} description={t('patient.audit.subtitle')} />
      {audit.isPending ? (
        <Card>
          <LoadingBlock lines={6} />
        </Card>
      ) : audit.isError ? (
        <Card>
          <ErrorState error={audit.error} onRetry={() => void audit.refetch()} />
        </Card>
      ) : audit.data.data.length === 0 ? (
        <Card>
          <EmptyState
            icon={<ScrollText aria-hidden className="h-6 w-6" />}
            title={t('patient.audit.empty')}
            description={t('patient.audit.emptyBody')}
          />
        </Card>
      ) : (
        <>
          <Card padding="none">
            <ol className="divide-y divide-line">
              {audit.data.data.map((entry) => (
                <li key={entry.id} className="flex flex-col gap-1 px-5 py-4 sm:flex-row sm:items-center sm:gap-4 sm:px-6">
                  <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-center gap-2 text-sm font-bold text-ink">
                      <span className="truncate">{entry.by}</span>
                      <Badge tone={ROLE_TONE[entry.role]}>{t(`roles.${entry.role}`)}</Badge>
                    </p>
                    <p className="mt-0.5 text-sm text-body">{auditDescription(entry, t)}</p>
                  </div>
                  <time dateTime={entry.at} className="shrink-0 text-xs text-slate">
                    {formatDateTime(entry.at, lang)}
                  </time>
                </li>
              ))}
            </ol>
          </Card>
          {audit.data.meta && <Pagination meta={audit.data.meta} onPageChange={setPage} disabled={audit.isFetching} />}
        </>
      )}
    </>
  )
}
