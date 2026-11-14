import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react'
import { useLanguage } from '@/i18n/useLanguage'
import { formatNumber } from '@/lib/format'
import { Sparkline } from '../charts/Sparkline'
import { change } from '../charts/scale'

/** "18% more than the previous 30 days", with an arrow; colour never carries it alone. */
export function DeltaLine({ current, previous, days, inverse = false }: { current: number; previous: number; days: number; inverse?: boolean }) {
  const { t } = useTranslation()
  const lang = useLanguage()
  const c = change(current, previous)
  const tone = inverse ? 'text-white/80' : c.direction === 'up' ? 'text-emerald-700' : c.direction === 'down' ? 'text-amber-700' : 'text-slate'
  const Icon = c.direction === 'up' ? ArrowUpRight : c.direction === 'down' ? ArrowDownRight : Minus
  const text =
    c.percent === null
      ? c.diff > 0
        ? t('admin.delta.fresh', { days: formatNumber(days, lang) })
        : t('admin.delta.flat', { days: formatNumber(days, lang) })
      : c.direction === 'flat'
        ? t('admin.delta.flat', { days: formatNumber(days, lang) })
        : t(`admin.delta.${c.direction}`, { percent: formatNumber(Math.abs(c.percent), lang), days: formatNumber(days, lang) })
  return (
    <p className={`flex items-center gap-1 text-xs font-semibold ${tone}`}>
      <Icon aria-hidden className="h-3.5 w-3.5 shrink-0" />
      <span>{text}</span>
    </p>
  )
}

interface StatTileProps {
  label: string
  value: number
  sub: ReactNode
  delta?: ReactNode
  trend?: number[]
  color: string
  icon: ReactNode
  action?: ReactNode
  tone?: 'default' | 'attention'
}

/** Label · value · context line · optional change and 30-point trend. */
export function StatTile({ label, value, sub, delta, trend, color, icon, action, tone = 'default' }: StatTileProps) {
  const lang = useLanguage()
  return (
    <section
      aria-label={label}
      className={`group relative flex flex-col overflow-hidden rounded-2xl border p-5 shadow-card transition hover:-translate-y-0.5 hover:shadow-soft ${
        tone === 'attention' ? 'border-amber-200 bg-linear-to-br from-amber-50 to-white' : 'border-line bg-white'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-semibold text-slate">{label}</p>
        <span
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
          style={{ background: `${color}14`, color }}
        >
          {icon}
        </span>
      </div>
      <p className="mt-1 text-[2rem] font-black leading-none tracking-tight text-ink">{formatNumber(value, lang)}</p>
      <div className="mt-2 space-y-1">
        <p className="text-xs text-slate">{sub}</p>
        {delta}
      </div>
      {trend && <Sparkline values={trend} color={color} className="mt-auto pt-3" />}
      {action && <div className="mt-auto pt-3">{action}</div>}
    </section>
  )
}
