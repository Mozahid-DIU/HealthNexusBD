import { useMemo, useRef, type PointerEvent, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { FileCheck2, KeyRound, ShieldAlert } from 'lucide-react'
import { Logo } from '@/components/brand/icons'
import { prefersReducedMotion } from './motion'

function Chip({
  icon,
  tint,
  title,
  sub,
  className,
  delay,
}: {
  icon: ReactNode
  tint: string
  title: string
  sub: string
  className: string
  delay: number
}) {
  return (
    <div className={`absolute ${className}`}>
      <div className="lp-rise" style={{ animationDelay: `${delay}ms` }}>
        <div className="lp-float flex items-center gap-3 rounded-2xl bg-white/95 py-2.5 pl-2.5 pr-4 shadow-[0_18px_40px_rgba(2,12,27,0.35)] ring-1 ring-white/60 backdrop-blur" style={{ animationDelay: `${delay * 2}ms` }}>
          <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${tint}`}>{icon}</span>
          <span className="min-w-0">
            <span className="block text-[13px] font-bold leading-tight text-ink">{title}</span>
            <span className="block text-[11px] text-slate">{sub}</span>
          </span>
        </div>
      </div>
    </div>
  )
}

/**
 * The hero's living illustration of the product: the lifelong UHID card (it tilts toward
 * the pointer) with the three moments it enables floating around it — a consent grant,
 * an AI allergy alert and a lab report arriving.
 */
export function HeroVisual() {
  const { t } = useTranslation()
  const card = useRef<HTMLDivElement>(null)
  const still = useMemo(() => prefersReducedMotion(), [])

  const tilt = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== 'mouse' || still || !card.current) return
    const box = event.currentTarget.getBoundingClientRect()
    const x = (event.clientX - box.left) / box.width - 0.5
    const y = (event.clientY - box.top) / box.height - 0.5
    card.current.style.transform = `perspective(1100px) rotateY(${x * 14}deg) rotateX(${-y * 12}deg)`
  }
  const settle = () => {
    if (card.current) card.current.style.transform = ''
  }

  return (
    <div className="relative mx-auto aspect-[1/1.3] w-full max-w-[520px] sm:aspect-[1/0.92]" onPointerMove={tilt} onPointerLeave={settle} aria-hidden>
      {/* Orbit and glow behind the card. */}
      <div className="absolute inset-[6%] rounded-full border border-dashed border-white/15 lp-spin-slow" />
      <div className="absolute inset-[22%] rounded-full bg-teal/30 blur-[70px]" />

      <div className="absolute inset-0 flex items-center justify-center">
        <div className="lp-rise w-[78%]" style={{ animationDelay: '250ms' }}>
          <div
            ref={card}
            className="relative overflow-hidden rounded-[22px] bg-gradient-to-br from-[#1670d0] via-brand to-[#083d7a] p-6 text-white shadow-[0_40px_80px_rgba(2,12,27,0.55)] ring-1 ring-white/20 transition-transform duration-300 ease-out sm:p-7"
          >
            <span className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-white/10" />
            <span className="pointer-events-none absolute -bottom-20 -left-10 h-48 w-48 rounded-full bg-teal/25 blur-2xl" />
            <div className="relative flex items-center justify-between">
              <span className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-white/75">
                <Logo size={16} />
                {t('landing.hero.cardLabel')}
              </span>
              <span className="rounded-md bg-white/15 px-2 py-0.5 text-[10px] font-bold tracking-wider">BD</span>
            </div>
            {/* A contact chip, like a real ID card. */}
            <span className="relative mt-6 block h-9 w-12 rounded-md bg-gradient-to-br from-amber-200 to-amber-400/80 shadow-inner" />
            <p className="relative mt-5 text-[10px] uppercase tracking-[0.2em] text-white/80">{t('landing.hero.cardFormat')}</p>
            <p className="relative mt-1 font-mono text-[clamp(1.25rem,2.6vw,1.75rem)] font-bold tracking-[0.08em]">BD-YYYY-XXXXX</p>
            <div className="relative mt-6 flex items-end justify-between gap-4">
              <div>
                <p className="text-[10px] uppercase tracking-[0.18em] text-white/80">{t('landing.hero.cardHolder')}</p>
                <p className="text-sm font-semibold">{t('landing.hero.cardHolderValue')}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] uppercase tracking-[0.18em] text-white/80">{t('landing.hero.cardIssuedBy')}</p>
                <p className="text-sm font-semibold">HealthNexus BD</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Chip
        className="left-0 top-[1%] sm:-left-4 sm:top-[9%]"
        delay={700}
        tint="bg-emerald-50 text-emerald-600"
        icon={<KeyRound className="h-[18px] w-[18px]" />}
        title={t('landing.hero.chipConsent')}
        sub={t('landing.hero.chipConsentSub')}
      />
      <Chip
        className="right-0 top-[14%] sm:-right-6 sm:-top-[2%]"
        delay={1000}
        tint="bg-red-50 text-red-600"
        icon={<ShieldAlert className="h-[18px] w-[18px]" />}
        title={t('landing.hero.chipAllergy')}
        sub={t('landing.hero.chipAllergySub')}
      />
      <Chip
        className="bottom-[1%] left-[4%] sm:bottom-[4%]"
        delay={1300}
        tint="bg-teal/10 text-teal"
        icon={<FileCheck2 className="h-[18px] w-[18px]" />}
        title={t('landing.hero.chipLab')}
        sub={t('landing.hero.chipLabSub')}
      />
    </div>
  )
}
