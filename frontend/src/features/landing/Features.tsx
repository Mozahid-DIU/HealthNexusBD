import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { BellRing, FlaskConical, Fingerprint, IdCard, Languages, ScrollText, Sparkles } from 'lucide-react'
import { Container } from '@/components/ui/Container'
import { AiVisual, AuditVisual, LabVisual, LanguageVisual, OtpVisual, ReminderVisual, TimelineVisual } from './FeatureVisuals'
import { Reveal } from './motion'
import { SectionHeading } from './SectionHeading'

function Tile({
  icon,
  title,
  body,
  visual,
  className = '',
  delay = 0,
  tone = 'light',
}: {
  icon: ReactNode
  title: string
  body: string
  visual: ReactNode
  className?: string
  delay?: number
  tone?: 'light' | 'tint'
}) {
  return (
    <Reveal delay={delay} className={className}>
      <article
        className={`group relative flex h-full flex-col overflow-hidden rounded-3xl border p-6 transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_60px_rgba(11,92,173,0.14)] sm:p-7 ${
          tone === 'tint' ? 'border-brand/10 bg-linear-to-br from-[#eef5ff] to-[#f2fbfb]' : 'border-line bg-surface-soft'
        }`}
      >
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-brand shadow-card ring-1 ring-line transition group-hover:scale-110 group-hover:bg-brand group-hover:text-white">
          {icon}
        </span>
        <h3 className="mt-5 text-xl font-black tracking-tight text-ink">{title}</h3>
        <p className="mt-2 text-[15px] leading-relaxed text-slate">{body}</p>
        <div className="mt-auto">{visual}</div>
      </article>
    </Reveal>
  )
}

/** Bento of what the platform does, each tile with a small live demo of the moment. */
export function Features() {
  const { t } = useTranslation()
  const icon = 'h-5 w-5'
  return (
    <section id="features" className="relative scroll-mt-20 bg-white py-24 sm:py-32">
      <div aria-hidden className="lp-grid-light pointer-events-none absolute inset-x-0 top-0 h-112" />
      <Container className="relative">
        <SectionHeading eyebrow={t('landing.features.eyebrow')} title={t('landing.features.title')} subtitle={t('landing.features.subtitle')} />

        <div className="mt-14 grid gap-5 md:grid-cols-6">
          <Tile className="md:col-span-4" tone="tint" icon={<IdCard className={icon} />} title={t('landing.features.idTitle')} body={t('landing.features.idBody')} visual={<TimelineVisual />} />
          <Tile className="md:col-span-2" delay={100} icon={<Fingerprint className={icon} />} title={t('landing.features.consentTitle')} body={t('landing.features.consentBody')} visual={<OtpVisual />} />
          <Tile className="md:col-span-2" icon={<Sparkles className={icon} />} title={t('landing.features.aiTitle')} body={t('landing.features.aiBody')} visual={<AiVisual />} />
          <Tile className="md:col-span-2" delay={100} icon={<FlaskConical className={icon} />} title={t('landing.features.labTitle')} body={t('landing.features.labBody')} visual={<LabVisual />} />
          <Tile className="md:col-span-2" delay={200} icon={<ScrollText className={icon} />} title={t('landing.features.auditTitle')} body={t('landing.features.auditBody')} visual={<AuditVisual />} />
          <Tile className="md:col-span-3" icon={<Languages className={icon} />} title={t('landing.features.langTitle')} body={t('landing.features.langBody')} visual={<LanguageVisual />} />
          <Tile className="md:col-span-3" delay={100} tone="tint" icon={<BellRing className={icon} />} title={t('landing.features.remindTitle')} body={t('landing.features.remindBody')} visual={<ReminderVisual />} />
        </div>
      </Container>
    </section>
  )
}
