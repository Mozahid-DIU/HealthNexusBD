import { useId, useLayoutEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Table2 } from 'lucide-react'
import { useLanguage } from '@/i18n/useLanguage'
import { formatDay, formatNumber } from '@/lib/format'
import { tooltipLeft } from './scale'

/**
 * Chart colours, validated as a set (scripts/validate_palette.js, light surface #fff,
 * all pairs): CVD ΔE ≥ 15, normal-vision ΔE ≥ 21, every slot ≥ 3:1 contrast. Assigned
 * in this fixed order, never cycled. Brand blue, orange, teal.
 */
export const SERIES_COLORS = ['#0b5cad', '#eb6834', '#0fa3a3'] as const

export interface Series {
  key: string
  label: string
  color: string
  values: number[]
}

/** Legend for two or more series: the swatch mirrors the mark, text stays in ink. */
export function Legend({ series, mark }: { series: Series[]; mark: 'line' | 'rect' }) {
  const lang = useLanguage()
  if (series.length < 2) return null
  return (
    <ul className="flex flex-wrap gap-x-5 gap-y-1.5 text-sm">
      {series.map((s) => (
        <li key={s.key} className="flex items-center gap-2">
          <span
            aria-hidden
            className={mark === 'line' ? 'h-[3px] w-3.5 rounded-full' : 'h-2.5 w-2.5 rounded-[3px]'}
            style={{ background: s.color }}
          />
          <span className="text-slate">{s.label}</span>
          <span className="font-semibold tabular-nums text-ink">
            {formatNumber(
              s.values.reduce((a, b) => a + b, 0),
              lang,
            )}
          </span>
        </li>
      ))}
    </ul>
  )
}

/** The hover/focus read-out: values lead, labels follow, keyed by a short line. */
export function Tooltip({
  date,
  rows,
  total,
  x,
  width,
}: {
  date: string
  rows: Array<{ key: string; label: string; color: string; value: number }>
  total?: number
  x: number
  width: number
}) {
  const { t } = useTranslation()
  const lang = useLanguage()
  const ref = useRef<HTMLDivElement>(null)
  const [left, setLeft] = useState(() => tooltipLeft(x, width, 160))
  // Measure the real tooltip before paint, then keep it inside the chart.
  useLayoutEffect(() => {
    setLeft(tooltipLeft(x, width, ref.current?.offsetWidth ?? 160))
  }, [x, width, date])
  return (
    <div
      ref={ref}
      role="presentation"
      className="pointer-events-none absolute top-2 z-10 min-w-[10rem] max-w-[calc(100%-8px)] rounded-xl bg-white px-3.5 py-2.5 text-sm shadow-[0_10px_30px_rgba(15,27,45,0.16)] ring-1 ring-line"
      style={{ left }}
    >
      <p className="mb-1.5 text-xs font-semibold text-faint">{formatDay(date, lang)}</p>
      <ul className="space-y-1">
        {rows.map((r) => (
          <li key={r.key} className="flex items-center gap-2">
            <span aria-hidden className="h-[3px] w-3 rounded-full" style={{ background: r.color }} />
            <span className="font-bold tabular-nums text-ink">{formatNumber(r.value, lang)}</span>
            <span className="text-slate">{r.label}</span>
          </li>
        ))}
      </ul>
      {total !== undefined && (
        <p className="mt-1.5 border-t border-line pt-1.5 text-xs text-slate">
          {t('admin.charts.total')}: <span className="font-bold tabular-nums text-ink">{formatNumber(total, lang)}</span>
        </p>
      )}
    </div>
  )
}

/** Every value in the chart as a table: the view that never depends on colour or hover. */
export function DataTable({ title, dates, series }: { title: string; dates: string[]; series: Series[] }) {
  const { t } = useTranslation()
  const lang = useLanguage()
  const [open, setOpen] = useState(false)
  const tableId = useId()
  return (
    <div className="mt-3">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls={open ? tableId : undefined}
        className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-semibold text-slate transition hover:bg-surface-soft hover:text-ink focus-visible:outline-2 focus-visible:outline-brand"
      >
        <Table2 aria-hidden className="h-3.5 w-3.5" />
        {open ? t('admin.charts.hideTable') : t('admin.charts.showTable')}
      </button>
      {open && (
        <div id={tableId} className="mt-2 max-h-64 overflow-auto rounded-xl ring-1 ring-line">
          <table className="w-full text-left text-sm">
            <caption className="sr-only">{title}</caption>
            <thead className="sticky top-0 bg-surface-soft text-xs text-slate">
              <tr>
                <th scope="col" className="px-3 py-2 font-semibold">
                  {t('admin.charts.date')}
                </th>
                {series.map((s) => (
                  <th key={s.key} scope="col" className="px-3 py-2 text-right font-semibold">
                    {s.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-line tabular-nums">
              {dates.map((date, i) => (
                <tr key={date}>
                  <th scope="row" className="px-3 py-1.5 font-medium text-body">
                    {formatDay(date, lang)}
                  </th>
                  {series.map((s) => (
                    <td key={s.key} className="px-3 py-1.5 text-right text-ink">
                      {formatNumber(s.values[i] ?? 0, lang)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

/** Shared chart geometry. */
export const MARGIN = { top: 14, right: 14, bottom: 28, left: 40 }

/** Which x positions get a date label: a handful, evenly spread, always the last. */
export function xTickIndices(count: number, width: number): number[] {
  if (count <= 1) return [0]
  const wanted = Math.min(count, width < 480 ? 4 : 7)
  const picks = Array.from({ length: wanted }, (_, k) => Math.round((k * (count - 1)) / (wanted - 1)))
  return [...new Set(picks)]
}

/** Keyboard: ←/→ step through the days, Home/End jump, Esc clears. */
export function nextIndex(key: string, current: number | null, count: number): number | null | undefined {
  if (count === 0) return undefined
  const at = current ?? count - 1
  if (key === 'ArrowLeft') return Math.max(0, at - 1)
  if (key === 'ArrowRight') return Math.min(count - 1, current === null ? count - 1 : at + 1)
  if (key === 'Home') return 0
  if (key === 'End') return count - 1
  if (key === 'Escape') return null
  return undefined
}

/**
 * Which day a chart is pointing at. Mouse hover follows the pointer; a tap on a touch
 * screen sticks until the chart loses focus; arrow keys step and are announced (hover
 * is not, so moving the mouse doesn't make a screen reader chatter). An index left over
 * from a longer range is dropped.
 */
export function useActiveDay(count: number) {
  const [state, setState] = useState<{ index: number | null; keyboard: boolean }>({ index: null, keyboard: false })
  const active = state.index !== null && state.index < count ? state.index : null
  return {
    active,
    announce: state.keyboard && active !== null,
    point: (index: number) => setState({ index, keyboard: false }),
    leave: (event: PointerEvent) => {
      if (event.pointerType !== 'touch') setState((s) => (s.keyboard ? s : { index: null, keyboard: false }))
    },
    clear: () => setState({ index: null, keyboard: false }),
    onKeyDown: (event: KeyboardEvent) => {
      const next = nextIndex(event.key, active, count)
      if (next === undefined) return
      event.preventDefault()
      setState({ index: next, keyboard: true })
    },
  }
}

/** The chart's summary and how to use it, read as the group's description. */
export function ChartDescription({ id, summary }: { id: string; summary: string }) {
  const { t } = useTranslation()
  return (
    <p id={id} className="sr-only">
      {summary} {t('admin.charts.keyboardHint')}
    </p>
  )
}
