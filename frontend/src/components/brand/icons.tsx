interface IconProps {
  size?: number
  className?: string
}

/**
 * HealthNexus mark — a flat shield with an ECG heartbeat, on-brand and crisp at any
 * size. The shield uses currentColor (set by the container); the heartbeat is teal.
 */
export function Logo({ size = 22, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" fill="currentColor" />
      <path
        d="M7 12.4h2l1.1-3 1.9 5.4 1.6-3.8 1.1 1.4H17"
        fill="none"
        stroke="#0FA3A3"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

const stroke = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
}

export function ShieldIcon({ size = 26, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} {...stroke}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  )
}

export function FingerprintIcon({ size = 26, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} {...stroke}>
      <path d="M2 12C2 6.477 6.477 2 12 2s10 4.477 10 10" />
      <path d="M5 12a7 7 0 0 1 7-7" />
      <path d="M12 5v.01" />
      <path d="M12 12a3 3 0 0 1 3 3" />
      <path d="M6 12a6 6 0 0 0 9.33 5" />
      <path d="M9 12a3 3 0 0 1 3-3" />
    </svg>
  )
}

export function SparkleIcon({ size = 26, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} {...stroke}>
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3z" />
      <path d="M5 3v4M19 17v4M3 5h4M17 19h4" />
    </svg>
  )
}

export function AuditIcon({ size = 26, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} {...stroke}>
      <rect x="5" y="2" width="14" height="20" rx="2" />
      <path d="M9 7h6M9 11h6M9 15h4" />
      <circle cx="18" cy="19" r="3" />
      <path d="m20.5 21.5-1.5-1.5" />
    </svg>
  )
}
