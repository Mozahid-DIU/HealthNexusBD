import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Container } from '@/components/ui/Container'
import { Button } from '@/components/ui/Button'
import { Logo } from '@/components/brand/icons'

const NAV_LINKS = [
  { label: 'Home', href: '#home' },
  { label: 'Features', href: '#features' },
  { label: 'How it works', href: '#how-it-works' },
  { label: 'About', href: '#about' },
]

export function Navbar() {
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
          <span className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-brand text-teal shadow-brand">
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
              key={l.label}
              href={l.href}
              className="text-sm font-medium text-slate transition-colors hover:text-brand"
            >
              {l.label}
            </a>
          ))}
        </div>

        <div className="hidden gap-2.5 md:flex">
          <Button variant="outline" size="sm" onClick={() => goAuth('login')}>
            Login
          </Button>
          <Button size="sm" onClick={() => goAuth('register')}>
            Register Free
          </Button>
        </div>

        {/* Mobile toggle */}
        <button
          className="p-1 md:hidden"
          aria-label="Toggle menu"
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
      </Container>

      {/* Mobile drawer */}
      <div
        className="overflow-hidden border-t border-brand/[0.08] bg-white transition-all duration-300 md:hidden"
        style={{ maxHeight: open ? 400 : 0 }}
      >
        <div className="px-6 pb-6 pt-3">
          {NAV_LINKS.map((l) => (
            <a
              key={l.label}
              href={l.href}
              onClick={() => setOpen(false)}
              className="block border-b border-brand/[0.06] py-3 text-[15px] font-medium text-body transition-colors hover:text-brand"
            >
              {l.label}
            </a>
          ))}
          <div className="mt-4 flex gap-2.5">
            <Button variant="outline" size="sm" className="flex-1" onClick={() => goAuth('login')}>
              Login
            </Button>
            <Button size="sm" className="flex-1" onClick={() => goAuth('register')}>
              Register Free
            </Button>
          </div>
        </div>
      </div>
    </nav>
  )
}
