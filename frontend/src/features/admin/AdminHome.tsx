import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Link, useSearchParams } from 'react-router-dom'
import { ArrowRight, FlaskConical, ShieldAlert, Stethoscope, UserCheck, UsersRound } from 'lucide-react'
import { PageHeader } from '@/components/layout/dashboard/PageHeader'
import { Card } from '@/components/ui/Card'
import { Segmented } from '@/components/ui/Segmented'
import { ErrorState, LoadingBlock, Skeleton } from '@/components/ui/Feedback'
import { useLanguage } from '@/i18n/useLanguage'
import { formatNumber } from '@/lib/format'
import { adminApi, adminKeys } from './api'
import { SERIES_COLORS, type Series } from './charts/ChartParts'
import { ColumnChart } from './charts/ColumnChart'
import { LineChart } from './charts/LineChart'
import { HeroTile } from './overview/HeroTile'
import { RecentActivity } from './overview/RecentActivity'
import { DeltaLine, StatTile } from './overview/Tiles'
import type { Metric, RangeDays, Trends } from './types'

const RANGES: RangeDays[] = [7, 30, 90]

function RangePicker({ value, onChange }: { value: RangeDays; onChange: (days: RangeDays) => void }) {
  const { t } = useTranslation()
  return (
    <Segmented
      label={t('admin.home.range')}
      value={value}
      onChange={onChange}
      options={RANGES.map((days) => ({ value: days, label: t(`admin.home.range${days}`) }))}
    />
  )
}

function Attention({ doctors, labs }: { doctors: number; labs: number }) {
  const { t } = useTranslation()
  const lang = useLanguage()
  return (
    <div role="status" className="mb-6 flex flex-col gap-4 rounded-2xl border border-amber-200 bg-linear-to-r from-amber-50 to-white px-5 py-4 sm:flex-row sm:items-center">
      <div className="flex min-w-0 flex-1 gap-4">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
          <ShieldAlert aria-hidden className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <p className="font-bold text-ink">{t('admin.attention.title')}</p>
          <p className="text-sm text-body">
            {t('admin.attention.body', { doctors: formatNumber(doctors, lang), labs: formatNumber(labs, lang) })}
          </p>
        </div>
      </div>
      <Link
        to="/admin/verifications"
        className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl bg-navy px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
      >
        {t('admin.attention.action')}
        <ArrowRight aria-hidden className="h-4 w-4" />
      </Link>
    </div>
  )
}

const pick = (trends: Trends | undefined, metric: Metric) => trends?.series.map((p) => p[metric]) ?? []

export function AdminHome() {
  const { t } = useTranslation()
  const lang = useLanguage()
  const [params, setParams] = useSearchParams()
  const raw = Number(params.get('range'))
  const days: RangeDays = RANGES.includes(raw as RangeDays) ? (raw as RangeDays) : 30

  const dashboard = useQuery({ queryKey: adminKeys.dashboard(), queryFn: () => adminApi.dashboard(), refetchInterval: 60_000 })
  const trends = useQuery({
    queryKey: adminKeys.trends(days),
    queryFn: () => adminApi.trends(days),
    placeholderData: keepPreviousData,
  })

  const header = (
    <PageHeader
      title={t('admin.home.greeting')}
      description={t('admin.home.subtitle')}
      actions={<RangePicker value={days} onChange={(next) => setParams(next === 30 ? {} : { range: String(next) }, { replace: true })} />}
    />
  )

  if (dashboard.isPending) {
    return (
      <>
        {header}
        <div role="status" aria-label={t('ui.loadingContent')} className="grid gap-4 lg:grid-cols-4">
          <Skeleton className="h-72 rounded-2xl lg:col-span-2 lg:row-span-2" />
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-36 rounded-2xl" />
          ))}
        </div>
      </>
    )
  }
  if (dashboard.isError) {
    return (
      <>
        {header}
        <Card>
          <ErrorState error={dashboard.error} onRetry={() => void dashboard.refetch()} />
        </Card>
      </>
    )
  }

  const d = dashboard.data.data
  const tr = trends.data?.data
  const now = tr?.totals.current
  const before = tr?.totals.previous
  const n = (value: number) => formatNumber(value, lang)
  const pending = d.pending.doctors + d.pending.labs
  // Words describe the numbers on screen: the data's own window, not the button just pressed.
  const span = tr?.days ?? days
  const dates = tr?.series.map((p) => p.date) ?? []

  const activity: Series[] = [
    { key: 'records', label: t('admin.charts.records'), color: SERIES_COLORS[0], values: pick(tr, 'records') },
    { key: 'consents', label: t('admin.charts.consents'), color: SERIES_COLORS[1], values: pick(tr, 'consents') },
    { key: 'labReports', label: t('admin.charts.labReports'), color: SERIES_COLORS[2], values: pick(tr, 'labReports') },
  ]
  const registrations: Series[] = [
    { key: 'patients', label: t('admin.charts.patients'), color: SERIES_COLORS[0], values: pick(tr, 'patients') },
    { key: 'doctors', label: t('admin.charts.doctors'), color: SERIES_COLORS[1], values: pick(tr, 'doctors') },
    { key: 'labs', label: t('admin.charts.labs'), color: SERIES_COLORS[2], values: pick(tr, 'labs') },
  ]

  return (
    <>
      {header}
      {pending > 0 && <Attention doctors={d.pending.doctors} labs={d.pending.labs} />}

      <div className={`grid gap-4 transition-opacity sm:grid-cols-2 lg:grid-cols-4 ${trends.isPlaceholderData ? 'opacity-70' : ''}`}>
        <HeroTile dashboard={d} trends={tr} />
        <StatTile
          label={t('admin.stats.records')}
          value={d.clinical.records}
          sub={now ? t('admin.stats.newIn', { days: n(span), count: n(now.records) }) : ' '}
          delta={now && before && <DeltaLine current={now.records} previous={before.records} days={span} />}
          trend={pick(tr, 'records')}
          color={SERIES_COLORS[0]}
          icon={<Stethoscope aria-hidden className="h-4.5 w-4.5" />}
        />
        <StatTile
          label={t('admin.stats.labReports')}
          value={d.clinical.labReports}
          sub={now ? t('admin.stats.newIn', { days: n(span), count: n(now.labReports) }) : ' '}
          delta={now && before && <DeltaLine current={now.labReports} previous={before.labReports} days={span} />}
          trend={pick(tr, 'labReports')}
          color={SERIES_COLORS[2]}
          icon={<FlaskConical aria-hidden className="h-4.5 w-4.5" />}
        />
        <StatTile
          label={t('admin.stats.sessions')}
          value={d.activeSessions}
          sub={now ? t('admin.stats.granted', { days: n(span), count: n(now.consents) }) : ' '}
          delta={now && before && <DeltaLine current={now.consents} previous={before.consents} days={span} />}
          trend={pick(tr, 'consents')}
          color={SERIES_COLORS[1]}
          icon={<UserCheck aria-hidden className="h-4.5 w-4.5" />}
        />
        <StatTile
          label={t('admin.stats.pending')}
          value={pending}
          sub={t('admin.stats.suspended', { count: n(d.suspended) })}
          color="#b45309"
          tone={pending > 0 ? 'attention' : 'default'}
          icon={<UsersRound aria-hidden className="h-4.5 w-4.5" />}
          action={
            <Link to="/admin/verifications" className="inline-flex items-center gap-1 text-sm font-semibold text-brand hover:underline">
              {t('admin.stats.review')}
              <ArrowRight aria-hidden className="h-4 w-4" />
            </Link>
          }
        />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <Card as="section" aria-labelledby="activity-chart" className="min-w-0 xl:col-span-2">
          <h2 id="activity-chart" className="text-base font-bold text-ink">
            {t('admin.charts.activityTitle')}
          </h2>
          <p className="mb-4 mt-0.5 text-sm text-slate">{t('admin.charts.activitySubtitle')}</p>
          {trends.isPending ? (
            <LoadingBlock lines={6} />
          ) : trends.isError ? (
            <ErrorState error={trends.error} onRetry={() => void trends.refetch()} />
          ) : (
            <LineChart
              title={t('admin.charts.activityTitle')}
              summary={t('admin.charts.activitySummary', {
                days: n(span),
                records: n(now?.records ?? 0),
                labReports: n(now?.labReports ?? 0),
                consents: n(now?.consents ?? 0),
              })}
              dates={dates}
              series={activity}
              stale={trends.isPlaceholderData}
            />
          )}
        </Card>
        <RecentActivity />
      </div>

      <Card as="section" aria-labelledby="registrations-chart" className="mt-4">
        <h2 id="registrations-chart" className="text-base font-bold text-ink">
          {t('admin.charts.registrationsTitle')}
        </h2>
        <p className="mb-4 mt-0.5 text-sm text-slate">{t('admin.charts.registrationsSubtitle')}</p>
        {trends.isPending ? (
          <LoadingBlock lines={5} />
        ) : trends.isError ? (
          <ErrorState error={trends.error} onRetry={() => void trends.refetch()} />
        ) : (
          <ColumnChart
            title={t('admin.charts.registrationsTitle')}
            summary={t('admin.charts.registrationsSummary', {
              days: n(span),
              patients: n(now?.patients ?? 0),
              doctors: n(now?.doctors ?? 0),
              labs: n(now?.labs ?? 0),
            })}
            dates={dates}
            series={registrations}
            stale={trends.isPlaceholderData}
          />
        )}
      </Card>
    </>
  )
}
