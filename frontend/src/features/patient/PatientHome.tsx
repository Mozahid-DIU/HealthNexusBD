import type { ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { Bell, ChevronRight, FlaskConical, ShieldAlert, Stethoscope, UserCheck } from 'lucide-react'
import { PageHeader } from '@/components/layout/dashboard/PageHeader'
import { Card, CardHeader } from '@/components/ui/Card'
import { EmptyState, ErrorState, LoadingBlock } from '@/components/ui/Feedback'
import { UhidCard } from '@/features/account/UhidCard'
import { displayName } from '@/features/account/displayName'
import { useLanguage } from '@/i18n/useLanguage'
import { formatDate, formatNumber } from '@/lib/format'
import { useAuthStore } from '@/stores/auth'
import { patientApi, patientKeys } from './api'

interface StatProps {
  to: string
  label: string
  value: number | undefined
  icon: ReactNode
  highlight?: boolean
}

function Stat({ to, label, value, icon, highlight = false }: StatProps) {
  const lang = useLanguage()
  return (
    <Link
      to={to}
      className={`group flex items-center gap-4 rounded-2xl border bg-white p-4 shadow-card transition hover:-translate-y-0.5 hover:shadow-soft focus-visible:outline-2 focus-visible:outline-brand ${
        highlight ? 'border-amber-300 ring-2 ring-amber-100' : 'border-line'
      }`}
    >
      <span
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
          highlight ? 'bg-amber-50 text-amber-600' : 'bg-brand/[0.07] text-brand'
        }`}
      >
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block text-2xl font-black leading-none text-ink">
          {value === undefined ? '–' : formatNumber(value, lang)}
        </span>
        <span className="mt-1 block text-xs font-semibold text-slate">{label}</span>
      </span>
    </Link>
  )
}

/** Patient landing page: ID card, live counts and the latest records. */
export function PatientHome() {
  const { t } = useTranslation()
  const lang = useLanguage()
  const user = useAuthStore((s) => s.user)

  const consent = useQuery({
    queryKey: patientKeys.consent(),
    queryFn: () => patientApi.consent(),
    select: (res) => res.data,
  })
  // Same key and shape (the full envelope) as the inbox page and the bell share.
  const inbox = useQuery({ queryKey: patientKeys.notifications(1), queryFn: () => patientApi.notifications(1) })
  const labs = useQuery({ queryKey: patientKeys.labReports(1), queryFn: () => patientApi.labReports(1) })
  const records = useQuery({ queryKey: patientKeys.records(1, 3), queryFn: () => patientApi.records(1, 3) })

  const pending = consent.data?.pendingRequests.length ?? 0

  return (
    <>
      <PageHeader
        title={t('dashboard.overview.welcome', { name: user ? displayName(user) : '' })}
        description={t('dashboard.overview.subtitle')}
      />

      {pending > 0 && (
        <div role="status" className="mb-6 flex flex-wrap items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4">
          <ShieldAlert aria-hidden className="h-5 w-5 shrink-0 text-amber-600" />
          <div className="min-w-0 flex-1 text-sm text-amber-900">
            <p className="font-bold">{t('patient.home.pendingAlert', { count: formatNumber(pending, lang) })}</p>
            <p>{t('patient.home.pendingAlertBody')}</p>
          </div>
          <Link
            to="/patient/consent"
            className="rounded-xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-600"
          >
            {t('patient.home.review')}
          </Link>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
        {user?.patient?.uhid && (
          <UhidCard uhid={user.patient.uhid} holder={user.patient.fullName} bloodGroup={user.patient.bloodGroup} />
        )}
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          <Stat
            to="/patient/notifications"
            label={t('patient.home.unread')}
            value={inbox.data?.data.unreadCount}
            icon={<Bell aria-hidden className="h-5 w-5" />}
          />
          <Stat
            to="/patient/consent"
            label={t('patient.home.pendingRequests')}
            value={consent.data ? pending : undefined}
            highlight={pending > 0}
            icon={<ShieldAlert aria-hidden className="h-5 w-5" />}
          />
          <Stat
            to="/patient/consent"
            label={t('patient.home.activeSessions')}
            value={consent.data?.activeSessions.length}
            icon={<UserCheck aria-hidden className="h-5 w-5" />}
          />
          <Stat
            to="/patient/lab-reports"
            label={t('patient.home.labReports')}
            value={labs.data?.meta?.total}
            icon={<FlaskConical aria-hidden className="h-5 w-5" />}
          />
        </div>
      </div>

      <Card as="section" aria-labelledby="recent-records" className="mt-6">
        <CardHeader
          id="recent-records"
          title={t('patient.home.recentRecords')}
          action={
            <Link to="/patient/records" className="inline-flex items-center gap-1 text-sm font-semibold text-brand hover:underline">
              {t('patient.home.viewAll')}
              <ChevronRight aria-hidden className="h-4 w-4" />
            </Link>
          }
        />
        {records.isPending ? (
          <LoadingBlock />
        ) : records.isError ? (
          <ErrorState error={records.error} onRetry={() => void records.refetch()} />
        ) : records.data.data.length === 0 ? (
          <EmptyState
            icon={<Stethoscope aria-hidden className="h-6 w-6" />}
            title={t('patient.records.empty')}
            description={t('patient.records.emptyBody')}
          />
        ) : (
          <ul className="divide-y divide-line">
            {records.data.data.map((r) => (
              <li key={r.id}>
                <Link
                  to={`/patient/records/${r.id}`}
                  className="flex items-center justify-between gap-4 rounded-lg py-3 transition hover:bg-surface-soft focus-visible:outline-2 focus-visible:outline-brand sm:px-2"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-bold text-ink">{r.diagnosis ?? t('patient.records.untitled')}</span>
                    <span className="block truncate text-xs text-slate">
                      {r.doctor?.fullName ?? t('patient.records.unknownDoctor')} · {formatDate(r.createdAt, lang)}
                    </span>
                  </span>
                  <ChevronRight aria-hidden className="h-4 w-4 shrink-0 text-faint" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  )
}
