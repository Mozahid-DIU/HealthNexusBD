import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Menu, X } from 'lucide-react'
import { Container } from '@/components/ui/Container'
import { Logo } from '@/components/brand/icons'
import { LanguageToggle } from '@/components/i18n/LanguageToggle'

const NAV_LINKS = [
  { key: 'landing.nav.features', id: 'features' },
  { key: 'landing.nav.howItWorks', id: 'how-it-works' },
  { key: 'landing.nav.security', id: 'security' },
  { key: 'landing.nav.about', id: 'about' },
] as const
const SECTION_IDS = NAV_LINKS.map((l) => l.id)

/** The section currently in the middle of the screen, for the "you are here" mark. */
function useActiveSection(ids: readonly string[]) {
  const [active, setActive] = useState<string | null>(null)
  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(entry.target.id)
          // Leaving the marked section for one without a link (hero, roles): clear it.
          else setActive((current) => (current === entry.target.id ? null : current))
        }
      },
      { rootMargin: '-45% 0px -50% 0px' },
    )
    for (const id of ids) {
      const el = document.getElementById(id)
      if (el) observer.observe(el)
    }
    return () => observer.disconnect()
  }, [ids])
  return active
}

/**
 * Transparent over the dark hero, frosted white once the page scrolls. Highlights the
 * section in view; on phones a drawer holds the links and both calls to action.
 */
export function Navbar() {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const active = useActiveSection(SECTION_IDS)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  const solid = scrolled || open
  const linkTone = solid ? 'text-slate hover:text-brand' : 'text-white/75 hover:text-white'

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        solid ? 'border-b border-line bg-white/85 shadow-card backdrop-blur-xl' : 'border-b border-transparent'
      }`}
    >
      <Container className="flex h-[68px] items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-2.5 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-teal">
          <span className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-gradient-to-br from-brand to-teal text-white shadow-brand">
            <Logo />
          </span>
          <span className={`text-[17px] font-extrabold tracking-tight transition-colors ${solid ? 'text-brand' : 'text-white'}`}>
            HealthNexus <span className="text-teal">BD</span>
          </span>
        </Link>

        <nav aria-label={t('landing.nav.menu')} className="hidden items-center gap-1 lg:flex">
          {NAV_LINKS.map((l) => (
            <a
              key={l.id}
              href={`#${l.id}`}
              aria-current={active === l.id ? 'location' : undefined}
              className={`relative rounded-lg px-3.5 py-2 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-teal ${linkTone}`}
            >
              {t(l.key)}
              <span
                aria-hidden
                className={`absolute inset-x-3.5 -bottom-0.5 h-0.5 rounded-full bg-teal transition-transform duration-300 ${
                  active === l.id ? 'scale-x-100' : 'scale-x-0'
                }`}
              />
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-2.5 lg:flex">
          <LanguageToggle />
          <Link
            to="/login"
            className={`rounded-xl px-4 py-2 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-teal ${
              solid ? 'text-brand hover:bg-brand/[0.06]' : 'text-white hover:bg-white/10'
            }`}
          >
            {t('landing.nav.login')}
          </Link>
          <Link
            to="/register"
            className="rounded-xl bg-gradient-to-r from-brand to-[#0a7fb0] px-4 py-2 text-sm font-semibold text-white shadow-brand transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal"
          >
            {t('landing.nav.registerFree')}
          </Link>
        </div>

        <div className="flex items-center gap-2 lg:hidden">
          <LanguageToggle />
          <button
            type="button"
            className={`flex h-10 w-10 items-center justify-center rounded-xl transition focus-visible:outline-2 focus-visible:outline-teal ${
              solid ? 'text-brand hover:bg-brand/[0.06]' : 'text-white hover:bg-white/10'
            }`}
            aria-label={t('common.toggleMenu')}
            aria-expanded={open}
            aria-controls="landing-mobile-menu"
            onClick={() => setOpen((o) => !o)}
          >
            {open ? <X aria-hidden className="h-6 w-6" /> : <Menu aria-hidden className="h-6 w-6" />}
          </button>
        </div>
      </Container>

      <div
        id="landing-mobile-menu"
        className="overflow-hidden bg-white transition-[max-height] duration-300 lg:hidden"
        style={{ maxHeight: open ? 640 : 0 }}
        inert={!open}
      >
        <Container className="pb-6 pt-2">
          <nav aria-label={t('landing.nav.menu')}>
          {NAV_LINKS.map((l) => (
            <a
              key={l.id}
              href={`#${l.id}`}
              onClick={() => setOpen(false)}
              className="block border-b border-line py-3.5 text-[15px] font-semibold text-body transition-colors hover:text-brand"
            >
              {t(l.key)}
            </a>
          ))}
          </nav>
          <div className="mt-5 grid grid-cols-2 gap-2.5">
            <Link to="/login" className="rounded-xl border border-brand/30 py-2.5 text-center text-sm font-semibold text-brand">
              {t('landing.nav.login')}
            </Link>
            <Link to="/register" className="rounded-xl bg-brand py-2.5 text-center text-sm font-semibold text-white shadow-brand">
              {t('landing.nav.registerFree')}
            </Link>
          </div>
        </Container>
      </div>
    </header>
  )
}
