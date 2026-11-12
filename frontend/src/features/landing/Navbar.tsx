import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Container } from '@/components/ui/Container'
import { Button } from '@/components/ui/Button'
import { Logo } from '@/components/brand/icons'
import { LanguageToggle } from '@/components/i18n/LanguageToggle'

const NAV_LINKS = [
  { key: 'landing.nav.home', href: '#home' },
  { key: 'landing.nav.features', href: '#features' },
  { key: 'landing.nav.howItWorks', href: '#how-it-works' },
  { key: 'landing.nav.about', href: '#about' },
] as const

export function Navbar() {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()

  const goAuth = (tab: 'login' | 'register') => {
    setOpen(false)
    navigate(`/${tab}`)
  }

  return (
    <nav className="sticky top-0 z-50 border-b border-brand/[0.09] bg-white/95 shadow-card backdrop-blur-md">
      <Container className="flex h-[66px] items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-brand text-white shadow-brand">
            <Logo />
          </span>
          <span className="text-[17px] font-extrabold tracking-tight text-brand">
            HealthNexus <span className="text-teal">BD</span>
          </span>
        </Link>

        {/* Desktop links */}
        <div className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((l) => (
            <a
              key={l.key}
              href={l.href}
              className="text-sm font-medium text-slate transition-colors hover:text-brand"
            >
              {t(l.key)}
            </a>
          ))}
        </div>

        <div className="hidden items-center gap-2.5 md:flex">
          <LanguageToggle />
          <Button variant="outline" size="sm" onClick={() => goAuth('login')}>
            {t('landing.nav.login')}
          </Button>
          <Button size="sm" onClick={() => goAuth('register')}>
            {t('landing.nav.registerFree')}
          </Button>
        </div>

        {/* Mobile: language + menu toggle */}
        <div className="flex items-center gap-2 md:hidden">
          <LanguageToggle />
          <button
            className="p-1"
            aria-label={t('common.toggleMenu')}
            aria-expanded={open}
            aria-controls="landing-mobile-menu"
            onClick={() => setOpen((o) => !o)}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--color-brand)" strokeWidth="2">
              {open ? (
                <>
                  <path d="M18 6L6 18" />
                  <path d="M6 6l12 12" />
                </>
              ) : (
                <>
                  <path d="M3 6h18" />
                  <path d="M3 12h18" />
                  <path d="M3 18h18" />
                </>
              )}
            </svg>
          </button>
        </div>
      </Container>

      {/* Mobile drawer */}
      <div
        id="landing-mobile-menu"
        className="overflow-hidden border-t border-brand/[0.08] bg-white transition-all duration-300 md:hidden"
        style={{ maxHeight: open ? 400 : 0 }}
        inert={!open}
      >
        <div className="px-6 pb-6 pt-3">
          {NAV_LINKS.map((l) => (
            <a
              key={l.key}
              href={l.href}
              onClick={() => setOpen(false)}
              className="block border-b border-brand/[0.06] py-3 text-[15px] font-medium text-body transition-colors hover:text-brand"
            >
              {t(l.key)}
            </a>
          ))}
          <div className="mt-4 flex gap-2.5">
            <Button variant="outline" size="sm" className="flex-1" onClick={() => goAuth('login')}>
              {t('landing.nav.login')}
            </Button>
            <Button size="sm" className="flex-1" onClick={() => goAuth('register')}>
              {t('landing.nav.registerFree')}
            </Button>
          </div>
        </div>
      </div>
    </nav>
  )
}
