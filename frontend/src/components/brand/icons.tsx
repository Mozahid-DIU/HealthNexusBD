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
