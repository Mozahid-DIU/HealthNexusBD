/** Axis maths for the admin charts: clean tick values, never 0 / 3.33 / 6.67. */

const STEPS = [1, 2, 2.5, 5, 10]

/**
 * A y-axis from 0 that fits `value` with 2–5 even, clean steps. Counts stay whole
 * numbers, and small values (or all zeros) get at least a 0–4 axis.
 */
export function niceScale(value: number, maxTicks = 5): { max: number; ticks: number[] } {
  const target = Math.max(value, 4)
  const rough = target / (maxTicks - 1)
  const magnitude = 10 ** Math.floor(Math.log10(rough))
  let step = magnitude * (STEPS.find((s) => s * magnitude >= rough) ?? 10)
  // Counts are whole numbers: a 2.5 step becomes 5 (0, 5, 10), never 0, 3, 6, 9.
  if (!Number.isInteger(step)) step = 5 * magnitude
  const top = Math.max(Math.ceil(value / step), Math.ceil(4 / step), 1) * step
  const ticks = Array.from({ length: Math.round(top / step) + 1 }, (_, i) => i * step)
  return { max: top, ticks }
}

export interface Change {
  diff: number
  /** Null when the previous period was zero: a percentage would be meaningless. */
  percent: number | null
  direction: 'up' | 'down' | 'flat'
}

/** This period vs the one before it. */
export function change(current: number, previous: number): Change {
  const diff = current - previous
  const direction = diff > 0 ? 'up' : diff < 0 ? 'down' : 'flat'
  const percent = previous === 0 ? null : Math.round((diff / previous) * 100)
  return { diff, percent, direction }
}

const TIP_GAP = 14

/**
 * Where the tooltip's left edge goes: right of the crosshair, flipped to the left when
 * it would overflow, and always kept inside the chart (narrow phones included).
 */
export function tooltipLeft(x: number, chartWidth: number, tipWidth: number): number {
  const right = x + TIP_GAP
  const left = right + tipWidth > chartWidth ? x - TIP_GAP - tipWidth : right
  return Math.max(0, Math.min(left, chartWidth - tipWidth))
}
