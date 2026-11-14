import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowRight, BadgeCheck, HeartHandshake, LockKeyhole } from 'lucide-react'
import { Container } from '@/components/ui/Container'
import { Reveal } from './motion'

/** Why the platform exists, then the one thing to do next. */
export function About() {
  const { t } = useTranslation()
  const values = [
    { icon: HeartHandshake, title: t('landing.about.value1'), body: t('landing.about.value1Body') },
    { icon: BadgeCheck, title: t('landing.about.value2'), body: t('landing.about.value2Body') },
    { icon: LockKeyhole, title: t('landing.about.value3'), body: t('landing.about.value3Body') },
  ]
  return (
    <section id="about" className="scroll-mt-20 bg-white py-24 sm:py-32">
      <Container>
        <div className="grid gap-12 lg:grid-cols-[1.2fr_0.8fr] lg:gap-16">
          <Reveal>
            <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-brand">{t('landing.about.eyebrow')}</h2>
            <p className="mt-5 text-[clamp(1.5rem,3vw,2.25rem)] font-bold leading-[1.35] tracking-tight text-ink">
              <span aria-hidden className="mr-1 font-black text-teal">“</span>
              {t('landing.about.statement')}
            </p>
          </Reveal>
          <ul className="space-y-4 self-end">
            {values.map((v, i) => (
              <Reveal as="li" key={v.title} delay={i * 120} className="flex gap-4 rounded-2xl border border-line p-5 transition hover:border-brand/30 hover:shadow-card">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand/[0.07] text-brand">
                  <v.icon aria-hidden className="h-5 w-5" />
                </span>
                <span>
                  <span className="block font-bold text-ink">{v.title}</span>
                  <span className="mt-0.5 block text-sm text-slate">{v.body}</span>
                </span>
              </Reveal>
            ))}
          </ul>
        </div>

        <Reveal className="mt-24">
          <div className="relative isolate overflow-hidden rounded-4xl bg-linear-to-br from-brand via-[#0a6fb8] to-teal px-8 py-14 text-center text-white shadow-[0_30px_80px_rgba(11,92,173,0.35)] sm:px-16 sm:py-20">
            <div aria-hidden className="absolute inset-0 -z-10">
              <span className="lp-drift absolute -left-20 -top-24 h-72 w-72 rounded-full bg-white/15 blur-3xl" />
              <span className="lp-drift absolute -bottom-24 -right-10 h-72 w-72 rounded-full bg-navy/30 blur-3xl" style={{ animationDelay: '-8s' }} />
            </div>
            <h2 className="mx-auto max-w-2xl text-[clamp(1.8rem,4vw,2.9rem)] font-black leading-[1.1] tracking-tight">{t('landing.cta.title')}</h2>
            <p className="mx-auto mt-4 max-w-xl text-lg text-white/80">{t('landing.cta.body')}</p>
            <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                to="/register"
                className="group inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-7 py-4 text-[15px] font-bold text-navy shadow-lg transition hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
              >
                {t('landing.cta.primary')}
                <ArrowRight aria-hidden className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center justify-center rounded-2xl border border-white/40 px-7 py-4 text-[15px] font-semibold text-white transition hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
              >
                {t('landing.cta.secondary')}
              </Link>
            </div>
          </div>
        </Reveal>
      </Container>
    </section>
  )
}
