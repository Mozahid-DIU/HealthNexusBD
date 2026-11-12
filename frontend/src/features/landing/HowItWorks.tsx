import { useTranslation } from 'react-i18next'
import { FileHeart, KeyRound, Stethoscope, UserRoundPlus } from 'lucide-react'
import { Container } from '@/components/ui/Container'
import { useLanguage } from '@/i18n/useLanguage'
import { formatNumber } from '@/lib/format'
import { Reveal, useInView } from './motion'
import { SectionHeading } from './SectionHeading'

/** Four steps on a line that fills in as the section comes into view. */
export function HowItWorks() {
  const { t } = useTranslation()
  const lang = useLanguage()
  const [ref, inView] = useInView<HTMLDivElement>('0px 0px -25% 0px')
  const steps = [
    { icon: UserRoundPlus, title: t('landing.how.step1'), body: t('landing.how.step1Body') },
    { icon: Stethoscope, title: t('landing.how.step2'), body: t('landing.how.step2Body') },
    { icon: KeyRound, title: t('landing.how.step3'), body: t('landing.how.step3Body') },
    { icon: FileHeart, title: t('landing.how.step4'), body: t('landing.how.step4Body') },
  ]
  return (
    <section id="how-it-works" className="relative scroll-mt-20 overflow-hidden bg-surface-soft py-24 sm:py-32">
      <Container>
        <SectionHeading eyebrow={t('landing.how.eyebrow')} title={t('landing.how.title')} />
        <div ref={ref} className="relative mt-16">
          {/* The connecting line: across on desktop, down on phones. */}
          <span aria-hidden className="absolute left-7 top-7 h-[calc(100%-3.5rem)] w-0.5 bg-line md:left-[12.5%] md:right-[12.5%] md:h-0.5 md:w-auto" />
          <span
            aria-hidden
            className={`absolute left-7 top-7 h-[calc(100%-3.5rem)] w-0.5 origin-top bg-gradient-to-b from-brand to-teal transition-transform duration-[1600ms] ease-out md:left-[12.5%] md:right-[12.5%] md:h-0.5 md:w-auto md:origin-left md:bg-gradient-to-r ${
              inView ? 'scale-100' : 'scale-y-0 md:scale-x-0 md:scale-y-100'
            }`}
          />
          <ol className="relative grid gap-10 md:grid-cols-4 md:gap-6">
          {steps.map((step, i) => (
            <li key={step.title} className="relative flex gap-5 md:flex-col md:items-center md:text-center">
              <Reveal delay={i * 180} className="shrink-0">
                <span className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-brand shadow-[0_10px_30px_rgba(11,92,173,0.14)] ring-1 ring-line">
                  <step.icon aria-hidden className="h-6 w-6" />
                  <span className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-brand to-teal text-[11px] font-bold text-white ring-2 ring-surface-soft">
                    {formatNumber(i + 1, lang)}
                  </span>
                </span>
              </Reveal>
              <Reveal delay={i * 180 + 80} className="md:mt-6">
                <h3 className="text-lg font-black tracking-tight text-ink">{step.title}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-slate">{step.body}</p>
              </Reveal>
            </li>
          ))}
          </ol>
        </div>
      </Container>
    </section>
  )
}
