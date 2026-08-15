import type { ReactNode } from 'react'
import { Container } from '@/components/ui/Container'
import { ShieldIcon, FingerprintIcon, SparkleIcon, AuditIcon } from '@/components/brand/icons'

interface Trust {
  icon: ReactNode
  label: string
  sub: string
}

const TRUST: Trust[] = [
  { icon: <ShieldIcon />, label: 'AES-256 Encrypted', sub: 'Military-grade data security' },
  { icon: <FingerprintIcon />, label: 'OTP Consent Access', sub: 'You approve every access' },
  { icon: <SparkleIcon />, label: 'AI-Powered Insights', sub: 'Gemini clinical summaries' },
  { icon: <AuditIcon />, label: 'Immutable Audit Log', sub: 'Tamper-proof access history' },
]

export function TrustBadges() {
  return (
    <section className="border-y border-line bg-surface-soft py-10">
      <Container className="grid grid-cols-2 gap-6 lg:grid-cols-4">
        {TRUST.map((t) => (
          <div key={t.label} className="flex items-center gap-3.5">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white text-teal shadow-card">
              {t.icon}
            </span>
            <div>
              <p className="text-sm font-bold text-ink">{t.label}</p>
              <p className="text-xs text-slate">{t.sub}</p>
            </div>
          </div>
        ))}
      </Container>
    </section>
  )
}
