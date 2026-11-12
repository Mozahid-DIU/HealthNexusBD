import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowRight, Check } from 'lucide-react'
import { Container } from '@/components/ui/Container'
import { HeroVisual } from './HeroVisual'

/** A heartbeat that draws itself once across the bottom of the hero. */
function Heartbeat() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 1440 120"
      preserveAspectRatio="none"
      className="pointer-events-none absolute inset-x-0 bottom-10 h-20 w-full opacity-60 sm:bottom-12"
    >
      <defs>
        <linearGradient id="ecg-fade" x1="0" x2="1">
          <stop offset="0" stopColor="#0fa3a3" stopOpacity="0" />
          <stop offset="0.25" stopColor="#5eead4" stopOpacity="0.9" />
          <stop offset="0.75" stopColor="#5eead4" stopOpacity="0.9" />
          <stop offset="1" stopColor="#0fa3a3" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path
        className="lp-ecg"
        d="M0 70 H380 L410 70 L428 40 L446 96 L470 8 L494 112 L512 70 H760 L782 70 L798 52 L814 84 L832 70 H1060 L1086 70 L1104 34 L1122 104 L1146 18 L1168 106 L1184 70 H1440"
        fill="none"
        stroke="url(#ecg-fade)"
        strokeWidth="2.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function Hero() {
  const { t } = useTranslation()
  const points = [t('landing.hero.point1'), t('landing.hero.point2'), t('landing.hero.point3')]

  return (
    <section id="home" className="lp-grain relative isolate overflow-hidden bg-[#06142a] text-white">
      {/* Atmosphere: drifting light, a fading grid, and the heartbeat. */}
      <div aria-hidden className="absolute inset-0 -z-10">
        <div className="lp-drift absolute -left-40 -top-40 h-[34rem] w-[34rem] rounded-full bg-brand/45 blur-[120px]" />
        <div className="lp-drift absolute -right-32 top-24 hidden h-[30rem] w-[30rem] rounded-full bg-teal/30 blur-[120px] sm:block" style={{ animationDelay: '-6s' }} />
        <div className="lp-grid absolute inset-0" />
      </div>
      <Heartbeat />

      <Container className="relative grid items-center gap-12 pb-40 pt-24 sm:pt-28 lg:grid-cols-[1.08fr_0.92fr] lg:pb-48 lg:pt-28">
        <div>
          <p className="lp-rise mb-6 inline-flex items-center gap-2.5 rounded-full border border-white/15 bg-white/[0.06] px-3.5 py-1.5 backdrop-blur" style={{ animationDelay: '0ms' }}>
            <span className="lp-pulse relative h-2 w-2 rounded-full text-teal">
              <span className="absolute inset-0 rounded-full bg-teal" />
            </span>
            <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-white/85">{t('landing.hero.badge')}</span>
          </p>

          <h1 className="text-[clamp(2.4rem,6vw,4.4rem)] font-black leading-[1.04] tracking-[-0.03em] [:lang(bn)_&]:text-[clamp(2.1rem,4.8vw,3.5rem)] [:lang(bn)_&]:leading-[1.2] [:lang(bn)_&]:tracking-normal">
            <span className="lp-rise block" style={{ animationDelay: '80ms' }}>
              {t('landing.hero.titleLine1')}
            </span>{' '}
            <span className="lp-rise block pb-1" style={{ animationDelay: '180ms' }}>
              <span className="lp-gradient-text">{t('landing.hero.titleHighlight')}</span>
            </span>{' '}
            <span className="lp-rise block" style={{ animationDelay: '280ms' }}>
              {t('landing.hero.titleLine2')}
            </span>
          </h1>

          <p className="lp-rise mt-7 max-w-[34rem] text-[17px] leading-[1.75] text-white/70" style={{ animationDelay: '400ms' }}>
            {t('landing.hero.body')}
          </p>

          <div className="lp-rise mt-9 flex flex-col gap-3 sm:flex-row" style={{ animationDelay: '520ms' }}>
            <Link
              to="/register"
              className="group inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-7 py-4 text-[15px] font-bold text-navy shadow-[0_14px_40px_rgba(94,234,212,0.25)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_50px_rgba(94,234,212,0.35)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-teal"
            >
              {t('landing.hero.ctaPrimary')}
              <ArrowRight aria-hidden className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center justify-center rounded-2xl border border-white/20 bg-white/[0.04] px-7 py-4 text-[15px] font-semibold text-white backdrop-blur transition hover:border-white/40 hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-teal"
            >
              {t('landing.hero.ctaSecondary')}
            </Link>
          </div>

          <ul className="lp-rise mt-9 flex flex-wrap gap-x-6 gap-y-2.5" style={{ animationDelay: '640ms' }}>
            {points.map((point) => (
              <li key={point} className="flex items-center gap-2 text-sm text-white/75">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-teal/20 text-teal">
                  <Check aria-hidden className="h-3 w-3" strokeWidth={3} />
                </span>
                {point}
              </li>
            ))}
          </ul>
        </div>

        <HeroVisual />
      </Container>

      {/* A soft curve into the light page below. */}
      <svg aria-hidden viewBox="0 0 1440 80" preserveAspectRatio="none" className="absolute inset-x-0 -bottom-px h-14 w-full text-white sm:h-20">
        <path d="M0 80 V40 C360 0 1080 0 1440 40 V80 Z" fill="currentColor" />
      </svg>
    </section>
  )
}
