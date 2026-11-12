import { useId } from 'react'
import { useLanguage } from '@/i18n/useLanguage'
import { formatDay, formatNumber } from '@/lib/format'
import { ChartDescription, DataTable, Legend, MARGIN, Tooltip, useActiveDay, xTickIndices, type Series } from './ChartParts'
import { niceScale } from './scale'
import { useElementWidth } from './useElementWidth'

interface ColumnChartProps {
  title: string
  summary: string
  dates: string[]
  /** Stacked bottom → top in this order. */
  series: Series[]
  height?: number
  stale?: boolean
}

const GAP = 2
const RADIUS = 4

/** A rect with only its top corners rounded (data end round, baseline square). */
function topRounded(x: number, y: number, w: number, h: number): string {
  const r = Math.min(RADIUS, w / 2, h)
  return `M${x},${y + h} V${y + r} Q${x},${y} ${x + r},${y} H${x + w - r} Q${x + w},${y} ${x + w},${y + r} V${y + h} Z`
}

/**
 * Stacked columns, one per day: ≤24px wide, a 2px surface gap between segments, the
 * top segment's data end rounded. Each column is its own hover/focus target.
 */
export function ColumnChart({ title, summary, dates, series, height = 240, stale = false }: ColumnChartProps) {
  const lang = useLanguage()
  const [ref, width] = useElementWidth<HTMLDivElement>()
  const descriptionId = useId()
  const n = dates.length
  const { active, announce, point, leave, clear, onKeyDown } = useActiveDay(n)
  const innerW = Math.max(1, width - MARGIN.left - MARGIN.right)
  const innerH = height - MARGIN.top - MARGIN.bottom
  const totals = dates.map((_, i) => series.reduce((sum, s) => sum + (s.values[i] ?? 0), 0))
  const { max, ticks } = niceScale(Math.max(0, ...totals))
  const band = innerW / Math.max(1, n)
  const barW = Math.max(2, Math.min(24, band * 0.62))
  const xCenter = (i: number) => MARGIN.left + band * (i + 0.5)
  const y = (v: number) => MARGIN.top + innerH - (v / max) * innerH
  const unit = innerH / max

  const readout =
    !announce || active === null
      ? ''
      : `${formatDay(dates[active], lang)}: ${series.map((s) => `${s.label} ${formatNumber(s.values[active] ?? 0, lang)}`).join(', ')}`

  return (
    <div>
      <Legend series={series} mark="rect" />
      <div
        ref={ref}
        role="group"
        aria-label={title}
        aria-describedby={descriptionId}
        tabIndex={0}
        onKeyDown={onKeyDown}
        onBlur={clear}
        className={`relative mt-3 rounded-lg outline-none transition-opacity focus-visible:ring-2 focus-visible:ring-brand/40 ${stale ? 'opacity-50' : ''}`}
      >
        <svg width={width} height={height} aria-hidden className="block overflow-visible">
          {ticks.map((tick) => (
            <g key={tick}>
              <line x1={MARGIN.left} x2={width - MARGIN.right} y1={y(tick)} y2={y(tick)} stroke="#e6eef7" strokeWidth={1} />
              <text x={MARGIN.left - 10} y={y(tick)} dy="0.32em" textAnchor="end" className="fill-faint text-[11px] tabular-nums">
                {formatNumber(tick, lang)}
              </text>
            </g>
          ))}
          {xTickIndices(n, width).map((i) => (
            <text key={i} x={xCenter(i)} y={height - 8} textAnchor="middle" className="fill-faint text-[11px]">
              {formatDay(dates[i], lang)}
            </text>
          ))}

          {dates.map((date, i) => {
            const left = xCenter(i) - barW / 2
            const top = series.reduce((last, s, k) => ((s.values[i] ?? 0) > 0 ? k : last), -1)
            let base = MARGIN.top + innerH
            return (
              <g key={date} opacity={active === null || active === i ? 1 : 0.4} className="transition-opacity">
                {series.map((s, k) => {
                  const value = s.values[i] ?? 0
                  if (value <= 0) return null
                  // Every segment above the first gives up 2px at its foot for the gap.
                  const h = Math.max(1, value * unit - (base < MARGIN.top + innerH ? GAP : 0))
                  const yTop = base - (base < MARGIN.top + innerH ? GAP : 0) - h
                  const shape =
                    k === top ? (
                      <path key={s.key} d={topRounded(left, yTop, barW, h)} fill={s.color} />
                    ) : (
                      <rect key={s.key} x={left} y={yTop} width={barW} height={h} fill={s.color} />
                    )
                  base = yTop
                  return shape
                })}
              </g>
            )
          })}

          {/* Each day's whole band is its hover target, wider than the bar itself. */}
          {dates.map((date, i) => (
            <rect
              key={date}
              x={MARGIN.left + band * i}
              y={MARGIN.top}
              width={band}
              height={innerH}
              fill="transparent"
              onPointerEnter={() => point(i)}
              onPointerDown={() => point(i)}
              onPointerLeave={leave}
            />
          ))}
        </svg>

        {active !== null && (
          <Tooltip
            date={dates[active]}
            x={xCenter(active)}
            width={width}
            total={totals[active]}
            rows={series.map((s) => ({ key: s.key, label: s.label, color: s.color, value: s.values[active] ?? 0 }))}
          />
        )}
        <p className="sr-only" aria-live="polite">
          {readout}
        </p>
        <ChartDescription id={descriptionId} summary={summary} />
      </div>
      <DataTable title={title} dates={dates} series={series} />
    </div>
  )
}
