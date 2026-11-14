import { useTranslation } from 'react-i18next'
import { ShieldCheck } from 'lucide-react'
import { Container } from '@/components/ui/Container'
import { useLanguage } from '@/i18n/useLanguage'
import { formatNumber } from '@/lib/format'
import { Reveal, useCountUp, useInView } from './motion'
import { SectionHeading } from './SectionHeading'

function Stat({ value, unit, label, start, delay }: { value: number; unit: string; label: string; start: boolean; delay: number }) {
  const lang = useLanguage()
  const shown = useCountUp(value, start)
  return (
    <Reveal delay={delay} className="relative rounded-3xl border border-white/10 bg-white/4 p-6 backdrop-blur">
      <p className="text-[clamp(2.6rem,5vw,3.6rem)] font-black leading-none tracking-tight">
        {/* The final value is what assistive tech reads; the counting is visual only. */}
        <span aria-hidden>{formatNumber(shown, lang)}</span>
        <span className="sr-only">{formatNumber(value, lang)}</span>
        <span className="lp-gradient-text text-[0.55em] font-bold">{unit}</span>
      </p>
      <p className="mt-3 text-sm leading-relaxed text-white/65">{label}</p>
    </Reveal>
  )
}

/** The real numbers behind the privacy promise (all from how the system is built). */
export function Security() {
  const { t } = useTranslation()
  const [ref, inView] = useInView<HTMLDivElement>()
  const points = [t('landing.security.point1'), t('landing.security.point2'), t('landing.security.point3'), t('landing.security.point4')]
  return (
    <section id="security" className="lp-grain relative isolate scroll-mt-20 overflow-hidden bg-[#06142a] py-24 text-white sm:py-32">
      <div aria-hidden className="absolute inset-0 -z-10">
        <div className="lp-drift absolute -right-40 top-0 hidden h-120 w-120 rounded-full bg-brand/35 blur-[120px] sm:block" />
        <div className="lp-grid absolute inset-0" />
      </div>
      <Container className="relative">
        <SectionHeading tone="dark" eyebrow={t('landing.security.eyebrow')} title={t('landing.security.title')} />
        <div ref={ref} className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Stat value={256} unit={t('landing.security.stat1Unit')} label={t('landing.security.stat1')} start={inView} delay={0} />
          <Stat value={6} unit={t('landing.security.stat2Unit')} label={t('landing.security.stat2')} start={inView} delay={100} />
          <Stat value={5} unit={t('landing.security.stat3Unit')} label={t('landing.security.stat3')} start={inView} delay={200} />
          <Stat value={30} unit={t('landing.security.stat4Unit')} label={t('landing.security.stat4')} start={inView} delay={300} />
        </div>
        <Reveal className="mt-10">
          <ul className="grid gap-3 sm:grid-cols-2">
            {points.map((point) => (
              <li key={point} className="flex items-center gap-3 rounded-2xl border border-white/10 px-4 py-3.5 text-[15px] text-white/80">
                <ShieldCheck aria-hidden className="h-5 w-5 shrink-0 text-teal" />
                {point}
              </li>
            ))}
          </ul>
        </Reveal>
      </Container>
    </section>
  )
}
