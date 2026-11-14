import { useTranslation } from 'react-i18next'
import { useLanguage } from '@/i18n/useLanguage'
import { formatNumber } from '@/lib/format'
import { SERIES_COLORS } from '../charts/ChartParts'
import { Sparkline } from '../charts/Sparkline'
import type { Dashboard, Trends } from '../types'
import { DeltaLine } from './Tiles'

/**
 * The one number the console leads with: everyone on the platform, split by role, with
 * how many joined in the chosen range and the daily join trend.
 */
export function HeroTile({ dashboard, trends }: { dashboard: Dashboard; trends: Trends | undefined }) {
  const { t } = useTranslation()
  const lang = useLanguage()
  const joined = trends ? trends.totals.current.patients + trends.totals.current.doctors + trends.totals.current.labs : 0
  const joinedBefore = trends ? trends.totals.previous.patients + trends.totals.previous.doctors + trends.totals.previous.labs : 0
  const daily = trends?.series.map((p) => p.patients + p.doctors + p.labs) ?? []
  const parts = [
    { key: 'patients', label: t('admin.charts.patients'), value: dashboard.users.patients, color: SERIES_COLORS[0] },
    { key: 'doctors', label: t('admin.charts.doctors'), value: dashboard.users.doctors, color: SERIES_COLORS[1] },
    { key: 'labs', label: t('admin.charts.labs'), value: dashboard.users.labs, color: SERIES_COLORS[2] },
  ]

  return (
    <section
      aria-label={t('admin.hero.title')}
      className="relative flex flex-col overflow-hidden rounded-2xl bg-linear-to-br from-navy via-[#0e2c52] to-brand-dark p-6 text-white shadow-soft sm:col-span-2 sm:p-7 lg:row-span-2"
    >
      {/* Soft light from the top right: depth without decoration noise. */}
      <span aria-hidden className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-teal/25 blur-3xl" />
      <p className="relative text-sm font-semibold text-white/70">{t('admin.hero.title')}</p>
      <p className="relative mt-2 text-6xl font-black leading-none tracking-tight sm:text-7xl">
        {formatNumber(dashboard.users.total, lang)}
      </p>

      <ul className="relative mt-5 grid grid-cols-3 gap-2">
        {parts.map((part) => (
          <li key={part.key} className="rounded-xl bg-white/[0.07] px-3 py-2.5 ring-1 ring-white/10">
            <span className="flex items-center gap-1.5 text-xs text-white/70">
              <span aria-hidden className="h-2 w-2 rounded-full" style={{ background: part.color }} />
              {part.label}
            </span>
            <span className="mt-0.5 block text-xl font-bold">{formatNumber(part.value, lang)}</span>
          </li>
        ))}
      </ul>

      {trends && (
        <div className="relative mt-auto pt-6">
          <p className="text-sm font-semibold">
            {t('admin.hero.joined', { days: formatNumber(trends.days, lang), count: formatNumber(joined, lang) })}
          </p>
          <div className="mt-1">
            <DeltaLine current={joined} previous={joinedBefore} days={trends.days} inverse />
          </div>
          <Sparkline values={daily} color="#5eead4" className="mt-3 h-14" />
        </div>
      )}
    </section>
  )
}
