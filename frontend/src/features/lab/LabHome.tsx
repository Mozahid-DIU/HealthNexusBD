import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { PageHeader } from '@/components/layout/dashboard/PageHeader'
import { Card, CardHeader } from '@/components/ui/Card'
import { ErrorState, LoadingBlock } from '@/components/ui/Feedback'
import { displayName } from '@/features/account/displayName'
import { PatientSearchForm } from '@/features/clinical/PatientSearchForm'
import { useLanguage } from '@/i18n/useLanguage'
import { formatNumber } from '@/lib/format'
import { useAuthStore } from '@/stores/auth'
import { labApi, labKeys } from './api'
import { UploadList } from './UploadList'

const RECENT = 5

/** Shown until the first upload: the whole job in three steps. */
function HowItWorks() {
  const { t } = useTranslation()
  const lang = useLanguage()
  const steps = [t('lab.home.step1'), t('lab.home.step2'), t('lab.home.step3')]
  return (
    <div>
      <p className="mb-4 text-sm font-bold text-ink">{t('lab.home.howTitle')}</p>
      <ol className="grid gap-3 sm:grid-cols-3">
        {steps.map((step, i) => (
          <li key={step} className="flex gap-3 rounded-xl bg-surface-soft p-4 sm:flex-col">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand text-sm font-bold text-white">
              {formatNumber(i + 1, lang)}
            </span>
            <span className="text-sm text-body">{step}</span>
          </li>
        ))}
      </ol>
    </div>
  )
}

export function LabHome() {
  const { t } = useTranslation()
  const lang = useLanguage()
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const recent = useQuery({ queryKey: labKeys.uploads(1, RECENT), queryFn: () => labApi.uploads(1, RECENT) })
  const total = recent.data?.meta?.total ?? 0

  return (
    <>
      <PageHeader title={t('lab.home.title', { name: user ? displayName(user) : '' })} description={t('lab.home.subtitle')} />

      <Card padding="lg" className="mb-6 bg-gradient-to-br from-white to-teal/[0.05]">
        <PatientSearchForm autoFocus onSearch={(value) => navigate(`/lab/upload?q=${encodeURIComponent(value)}`)} />
      </Card>

      <Card as="section" aria-labelledby="recent-uploads">
        <CardHeader
          id="recent-uploads"
          title={t('lab.home.recentTitle')}
          description={total > 0 ? t('lab.home.total', { count: formatNumber(total, lang) }) : undefined}
          action={
            total > RECENT && (
              <Link to="/lab/uploads" className="inline-flex items-center gap-1 text-sm font-semibold text-brand hover:underline">
                {t('lab.home.viewAll')}
                <ChevronRight aria-hidden className="h-4 w-4" />
              </Link>
            )
          }
        />
        {recent.isPending ? (
          <LoadingBlock />
        ) : recent.isError ? (
          <ErrorState error={recent.error} onRetry={() => void recent.refetch()} />
        ) : recent.data.data.length === 0 ? (
          <HowItWorks />
        ) : (
          <UploadList uploads={recent.data.data} />
        )}
      </Card>
    </>
  )
}
