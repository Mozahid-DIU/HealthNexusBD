import { useId, type PointerEvent } from 'react'
import { useLanguage } from '@/i18n/useLanguage'
import { formatDay, formatNumber } from '@/lib/format'
import { ChartDescription, DataTable, Legend, MARGIN, Tooltip, useActiveDay, xTickIndices, type Series } from './ChartParts'
import { niceScale } from './scale'
import { useElementWidth } from './useElementWidth'

interface LineChartProps {
  /** Accessible name; also the data table's caption. */
  title: string
  /** A sentence summarising what the chart shows, read before the details. */
  summary: string
  dates: string[]
  series: Series[]
  height?: number
  /** While refetching for a new range, keep the frame and dim it (no flash). */
  stale?: boolean
}

/**
 * Multi-series line chart: 2px lines, ringed end dots, hairline grid, and a crosshair
 * that snaps to the nearest day with one tooltip listing every series. Works with the
 * keyboard (←/→), and every value is also in the data table below it.
 */
export function LineChart({ title, summary, dates, series, height = 260, stale = false }: LineChartProps) {
  const lang = useLanguage()
  const [ref, width] = useElementWidth<HTMLDivElement>()
  const descriptionId = useId()
  const n = dates.length
  const { active, announce, point, leave, clear, onKeyDown } = useActiveDay(n)

  const innerW = Math.max(1, width - MARGIN.left - MARGIN.right)
  const innerH = height - MARGIN.top - MARGIN.bottom
  const { max, ticks } = niceScale(Math.max(0, ...series.flatMap((s) => s.values)))
  const x = (i: number) => MARGIN.left + (n <= 1 ? innerW / 2 : (i * innerW) / (n - 1))
  const y = (v: number) => MARGIN.top + innerH - (v / max) * innerH
  const path = (values: number[]) => values.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ')

  const pick = (event: PointerEvent<SVGRectElement>) => {
    const box = event.currentTarget.getBoundingClientRect()
    const px = event.clientX - box.left
    const i = n <= 1 ? 0 : Math.round((px / box.width) * (n - 1))
    point(Math.max(0, Math.min(n - 1, i)))
  }

  const readout =
    !announce || active === null
      ? ''
      : `${formatDay(dates[active], lang)}: ${series.map((s) => `${s.label} ${formatNumber(s.values[active] ?? 0, lang)}`).join(', ')}`

  return (
    <div>
      <Legend series={series} mark="line" />
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
            <text
              key={i}
              x={x(i)}
              y={height - 8}
              textAnchor={i === 0 ? 'start' : i === n - 1 ? 'end' : 'middle'}
              className="fill-faint text-[11px]"
            >
              {formatDay(dates[i], lang)}
            </text>
          ))}

          {series.map((s) => (
            <path key={s.key} d={path(s.values)} fill="none" stroke={s.color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
          ))}

          {active !== null && (
            <line x1={x(active)} x2={x(active)} y1={MARGIN.top} y2={MARGIN.top + innerH} stroke="#94a3b8" strokeWidth={1} />
          )}
          {/* End dots (or the hovered day's dots), ringed in the surface colour. */}
          {series.map((s) => {
            const i = active ?? n - 1
            return <circle key={s.key} cx={x(i)} cy={y(s.values[i] ?? 0)} r={4} fill={s.color} stroke="#fff" strokeWidth={2} />
          })}

          <rect
            x={MARGIN.left}
            y={MARGIN.top}
            width={innerW}
            height={innerH}
            fill="transparent"
            onPointerMove={pick}
            onPointerDown={pick}
            onPointerLeave={leave}
          />
        </svg>

        {active !== null && (
          <Tooltip
            date={dates[active]}
            x={x(active)}
            width={width}
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
