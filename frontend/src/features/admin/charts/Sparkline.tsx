const W = 120
const H = 36

/**
 * A small trend line for a stat tile. Decorative (the tile states the numbers), so it
 * is hidden from screen readers. The line keeps its 2px width at any size.
 */
export function Sparkline({ values, color, className = '' }: { values: number[]; color: string; className?: string }) {
  if (values.length < 2) return null
  const max = Math.max(1, ...values)
  const step = W / (values.length - 1)
  const pts = values.map((v, i) => [i * step, H - 2 - (v / max) * (H - 4)] as const)
  const line = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ')
  const area = `${line} L${W},${H} L0,${H} Z`
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-hidden className={`block h-9 w-full ${className}`}>
      <path d={area} fill={color} opacity={0.12} />
      <path d={line} fill="none" stroke={color} strokeWidth={2} vectorEffect="non-scaling-stroke" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  )
}
