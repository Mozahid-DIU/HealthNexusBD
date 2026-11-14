import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Logo } from '@/components/brand/icons'
import { LanguageToggle } from '@/components/i18n/LanguageToggle'

/** Hairline brand grid, strongest behind the card and fading out toward the edges. */
const GRID_STYLE = {
  backgroundImage:
    'linear-gradient(to right, rgba(11,92,173,0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(11,92,173,0.06) 1px, transparent 1px)',
  backgroundSize: '44px 44px',
  maskImage: 'radial-gradient(ellipse 55% 50% at 50% 38%, #000 20%, transparent 72%)',
  WebkitMaskImage: 'radial-gradient(ellipse 55% 50% at 50% 38%, #000 20%, transparent 72%)',
}

/** Quiet atmosphere: two soft glows, the grid, and a faint heartbeat line behind the card. */
function Backdrop() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(70%_55%_at_50%_-8%,rgba(11,92,173,0.13),transparent_70%)]" />
      <div className="absolute -bottom-48 -right-40 hidden h-120 w-120 rounded-full bg-teal/10 blur-[110px] sm:block" />
      <div className="absolute inset-0" style={GRID_STYLE} />
      <svg className="absolute left-0 top-[46%] hidden h-24 w-full sm:block" viewBox="0 0 1440 96" preserveAspectRatio="none">
        <defs>
          <linearGradient id="auth-ecg" x1="0" x2="1">
            <stop offset="0" stopColor="#0b5cad" stopOpacity="0" />
            <stop offset="0.3" stopColor="#0b5cad" stopOpacity="0.16" />
            <stop offset="0.7" stopColor="#0fa3a3" stopOpacity="0.16" />
            <stop offset="1" stopColor="#0fa3a3" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path
          className="auth-ecg"
          d="M0 48 H300 L326 48 L342 22 L358 74 L378 6 L398 90 L414 48 H1026 L1046 48 L1060 32 L1074 64 L1090 48 H1440"
          fill="none"
          stroke="url(#auth-ecg)"
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    </div>
  )
}

interface AuthLayoutProps {
  title: string
  subtitle: ReactNode
  children: ReactNode
  footer?: ReactNode
  /** `wide` gives longer forms (registration) a little more room. */
  width?: 'default' | 'wide'
}

/** Sign-in, sign-up and password reset: just the form, on one calm, focused card. */
export function AuthLayout({ title, subtitle, children, footer, width = 'default' }: AuthLayoutProps) {
  const { t } = useTranslation()
  return (
    <div className="relative flex min-h-screen flex-col bg-surface-soft">
      <Backdrop />

      <header className="relative z-10 flex items-center justify-between gap-4 px-4 py-5 sm:px-8">
        <Link
          to="/"
          className="flex items-center gap-2.5 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-linear-to-br from-brand to-navy text-white shadow-brand">
            <Logo size={20} />
          </span>
          <span className="text-[16px] font-extrabold tracking-tight text-ink">
            HealthNexus <span className="text-teal">BD</span>
          </span>
        </Link>
        <div className="flex items-center gap-4">
          <LanguageToggle />
          <Link to="/" className="hidden text-sm font-medium text-slate transition hover:text-brand sm:inline">
            {t('common.home')}
          </Link>
        </div>
      </header>

      <main id="main-content" className="relative z-10 flex flex-1 items-center justify-center px-4 pb-14 pt-4 sm:pt-6">
        <div className={`auth-rise w-full ${width === 'wide' ? 'max-w-120' : 'max-w-110'}`}>
          <div className="relative overflow-hidden rounded-[28px] bg-white px-6 pb-8 pt-9 shadow-[0_1px_2px_rgba(12,26,46,0.04),0_28px_70px_-18px_rgba(11,92,173,0.22)] ring-1 ring-line sm:px-10 sm:pb-10 sm:pt-11">
            {/* Brand accent along the top edge. */}
            <span aria-hidden className="absolute inset-x-0 top-0 h-1 bg-linear-to-r from-brand via-[#1f7fc4] to-teal" />

            <div className="mb-8 text-center">
              <span className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-linear-to-br from-brand to-teal text-white shadow-[0_10px_26px_-6px_rgba(11,92,173,0.55)]">
                <Logo size={24} />
              </span>
              <h1 className="text-[26px] font-black leading-tight tracking-tight text-ink sm:text-[28px]">{title}</h1>
              <p className="mx-auto mt-2 max-w-[34ch] text-sm leading-relaxed text-slate">{subtitle}</p>
            </div>

            {children}
          </div>

          {footer && <div className="mt-7 text-center text-sm text-slate">{footer}</div>}
        </div>
      </main>
    </div>
  )
}
