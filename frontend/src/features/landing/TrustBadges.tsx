import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Container } from '@/components/ui/Container'
import type { TranslationKey } from '@/i18n'
import { ShieldIcon, FingerprintIcon, SparkleIcon, AuditIcon } from '@/components/brand/icons'

interface Trust {
  icon: ReactNode
  label: TranslationKey
  sub: TranslationKey
}

const TRUST: Trust[] = [
  { icon: <ShieldIcon />, label: 'landing.trust.aesLabel', sub: 'landing.trust.aesSub' },
  { icon: <FingerprintIcon />, label: 'landing.trust.otpLabel', sub: 'landing.trust.otpSub' },
  { icon: <SparkleIcon />, label: 'landing.trust.aiLabel', sub: 'landing.trust.aiSub' },
  { icon: <AuditIcon />, label: 'landing.trust.auditLabel', sub: 'landing.trust.auditSub' },
]

export function TrustBadges() {
  const { t } = useTranslation()
  return (
    <section className="border-y border-line bg-surface-soft py-10">
      <Container className="grid grid-cols-2 gap-6 lg:grid-cols-4">
        {TRUST.map((item) => (
          <div key={item.label} className="flex items-center gap-3.5">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white text-teal shadow-card">
              {item.icon}
            </span>
            <div>
              <p className="text-sm font-bold text-ink">{t(item.label)}</p>
              <p className="text-xs text-slate">{t(item.sub)}</p>
            </div>
          </div>
        ))}
      </Container>
    </section>
  )
}
