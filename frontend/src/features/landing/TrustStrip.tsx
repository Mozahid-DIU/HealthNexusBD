import { useTranslation } from 'react-i18next'
import { BadgeCheck, FlaskConical, KeyRound, LockKeyhole, ScrollText } from 'lucide-react'
import { Container } from '@/components/ui/Container'
import { Reveal } from './motion'

/** The guarantees the platform is built on, as one quiet row under the hero. */
export function TrustStrip() {
  const { t } = useTranslation()
  const items = [
    { icon: LockKeyhole, label: t('landing.trust.aes') },
    { icon: KeyRound, label: t('landing.trust.otp') },
    { icon: BadgeCheck, label: t('landing.trust.bmdc') },
    { icon: FlaskConical, label: t('landing.trust.dghs') },
    { icon: ScrollText, label: t('landing.trust.audit') },
  ]
  return (
    <section aria-label={t('landing.trust.title')} className="bg-white pb-6 pt-4">
      <Container>
        <Reveal>
          <p className="text-center text-xs font-bold uppercase tracking-[0.2em] text-slate">{t('landing.trust.title')}</p>
          <ul className="mt-5 flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
            {items.map(({ icon: Icon, label }) => (
              <li key={label} className="flex items-center gap-2 text-sm font-semibold text-slate">
                <Icon aria-hidden className="h-4 w-4 text-teal" />
                {label}
              </li>
            ))}
          </ul>
        </Reveal>
      </Container>
    </section>
  )
}
