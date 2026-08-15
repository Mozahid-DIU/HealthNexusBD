import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Logo, ShieldIcon, FingerprintIcon, SparkleIcon } from '@/components/brand/icons'

const POINTS = [
  { icon: <ShieldIcon size={20} />, text: 'AES-256 encrypted medical records' },
  { icon: <FingerprintIcon size={20} />, text: 'You approve every access with an OTP' },
  { icon: <SparkleIcon size={20} />, text: 'AI-powered clinical summaries' },
]

/** Left brand panel — shown on large screens only. */
function BrandPanel() {
  return (
    <div className="relative hidden w-[44%] max-w-[560px] shrink-0 overflow-hidden bg-gradient-to-br from-brand to-navy lg:flex lg:flex-col">
      {/* mesh texture */}
      <svg className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.07]">
        <defs>
          <pattern id="authmesh" width="44" height="44" patternUnits="userSpaceOnUse">
            <path d="M44 0H0v44" fill="none" stroke="#fff" strokeWidth="0.8" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#authmesh)" />
      </svg>

      <div className="relative z-10 flex flex-1 flex-col justify-between p-12 text-white">
        <Link to="/" className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-white/15 text-white">
            <Logo />
          </span>
          <span className="text-[17px] font-extrabold tracking-tight">
            HealthNexus <span className="text-teal">BD</span>
          </span>
        </Link>

        <div>
          <h2 className="mb-6 text-[2rem] font-black leading-tight tracking-tight">
            Your health, unified and{' '}
            <span className="text-teal">under your control.</span>
          </h2>
          <ul className="space-y-4">
            {POINTS.map((p) => (
              <li key={p.text} className="flex items-center gap-3 text-[15px] text-white/90">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-teal">
                  {p.icon}
                </span>
                {p.text}
              </li>
            ))}
          </ul>
        </div>

        <p className="text-xs text-white/50">
          A secure national health-record platform for Bangladesh.
        </p>
      </div>
    </div>
  )
}

interface AuthLayoutProps {
  title: string
  subtitle: ReactNode
  children: ReactNode
  footer?: ReactNode
}

export function AuthLayout({ title, subtitle, children, footer }: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen bg-surface-soft">
      <BrandPanel />

      <div className="flex flex-1 flex-col">
        {/* Mobile top bar */}
        <header className="flex items-center justify-between px-6 py-5 lg:hidden">
          <Link to="/" className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-[9px] bg-brand text-white">
              <Logo size={18} />
            </span>
            <span className="text-[15px] font-extrabold tracking-tight text-brand">
              HealthNexus <span className="text-teal">BD</span>
            </span>
          </Link>
          <Link to="/" className="text-sm font-medium text-slate hover:text-brand">
            Home
          </Link>
        </header>

        <main className="flex flex-1 items-center justify-center px-6 pb-12 pt-2 lg:py-10">
          <div className="w-full max-w-[420px]">
            <h1 className="text-[26px] font-black tracking-tight text-ink">{title}</h1>
            <p className="mb-7 mt-1.5 text-sm text-slate">{subtitle}</p>
            {children}
            {footer && <div className="mt-6 text-center text-sm text-slate">{footer}</div>}
          </div>
        </main>
      </div>
    </div>
  )
}
