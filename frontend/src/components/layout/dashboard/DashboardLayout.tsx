import { Suspense, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { LogOut, Menu, X } from 'lucide-react'
import { Logo } from '@/components/brand/icons'
import { LanguageToggle } from '@/components/i18n/LanguageToggle'
import { Badge } from '@/components/ui/Badge'
import { LoadingBlock } from '@/components/ui/Feedback'
import { useDialogFocus } from '@/components/ui/useDialogFocus'
import { NAVIGATION, ROLE_HOME } from '@/app/navigation'
import { displayName } from '@/features/account/displayName'
import { useLogout } from '@/features/auth/useLogout'
import { formatLongDate, initials } from '@/lib/format'
import { useLanguage } from '@/i18n/useLanguage'
import { useAuthStore } from '@/stores/auth'
import type { AuthUser } from '@/types/api'

const SIDEBAR_WIDTH = 'lg:w-[264px]'

function Brand({ user }: { user: AuthUser }) {
  const { t } = useTranslation()
  return (
    <Link to={ROLE_HOME[user.role]} className="flex items-center gap-2.5 rounded-lg focus-visible:outline-2 focus-visible:outline-brand">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-brand text-white shadow-brand">
        <Logo />
      </span>
      <span className="min-w-0">
        <span className="block text-[15px] font-extrabold leading-tight tracking-tight text-brand">
          HealthNexus <span className="text-teal">BD</span>
        </span>
        <span className="block truncate text-[11px] font-semibold text-slate">{t(`dashboard.portal.${user.role}`)}</span>
      </span>
    </Link>
  )
}

function NavList({ user, onNavigate }: { user: AuthUser; onNavigate?: () => void }) {
  const { t } = useTranslation()
  return (
    <nav aria-label={t('dashboard.navLabel')} className="flex-1 overflow-y-auto px-3 py-4">
      <ul className="space-y-1">
        {NAVIGATION[user.role].map(({ to, label, icon: Icon, end }) => (
          <li key={to}>
            <NavLink
              to={to}
              end={end}
              onClick={onNavigate}
              className={({ isActive }) =>
                `group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-brand ${
                  isActive ? 'bg-brand/[0.08] text-brand' : 'text-slate hover:bg-surface-soft hover:text-ink'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && <span aria-hidden className="absolute inset-y-2 left-0 w-1 rounded-r-full bg-brand" />}
                  <Icon aria-hidden className="h-[18px] w-[18px] shrink-0" />
                  {t(label)}
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}

function UserCard({ user }: { user: AuthUser }) {
  const { t } = useTranslation()
  const logout = useLogout()
  const name = displayName(user)
  return (
    <div className="border-t border-line p-3">
      <div className="flex items-center gap-3 rounded-xl px-2 py-2">
        <span
          aria-hidden
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand to-teal text-xs font-bold text-white"
        >
          {initials(name)}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-ink" title={name}>
            {name}
          </p>
          <p className="truncate text-xs text-slate" title={user.email}>
            {user.email}
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={() => logout.mutate()}
        disabled={logout.isPending}
        className="mt-1 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate transition hover:bg-red-50 hover:text-red-600 disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-brand"
      >
        <LogOut aria-hidden className="h-[18px] w-[18px]" />
        {logout.isPending ? t('common.loggingOut') : t('common.logout')}
      </button>
    </div>
  )
}

function SidebarContent({ user, onNavigate }: { user: AuthUser; onNavigate?: () => void }) {
  return (
    <>
      <div className="flex h-[68px] items-center border-b border-line px-5">
        <Brand user={user} />
      </div>
      <NavList user={user} onNavigate={onNavigate} />
      <UserCard user={user} />
    </>
  )
}

function MobileDrawer({ user, onClose }: { user: AuthUser; onClose: () => void }) {
  const { t } = useTranslation()
  const panelRef = useRef<HTMLDivElement>(null)
  useDialogFocus(panelRef, true, onClose)

  return createPortal(
    <div className="fixed inset-0 z-[90] lg:hidden">
      <div aria-hidden className="absolute inset-0 bg-navy/40 backdrop-blur-[2px]" onClick={onClose} />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={t('dashboard.navLabel')}
        tabIndex={-1}
        className="relative flex h-full w-[82%] max-w-[300px] flex-col bg-white shadow-[0_0_48px_rgba(15,27,45,0.25)] outline-none"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label={t('common.closeMenu')}
          className="absolute right-3 top-4 flex h-9 w-9 items-center justify-center rounded-lg text-slate hover:bg-surface-soft focus-visible:outline-2 focus-visible:outline-brand"
        >
          <X aria-hidden className="h-5 w-5" />
        </button>
        {/* Tapping a link closes the drawer, even when it's the page already shown. */}
        <SidebarContent user={user} onNavigate={onClose} />
      </div>
    </div>,
    document.body,
  )
}

/**
 * Shell for every role's dashboard: fixed sidebar on desktop, slide-in drawer on
 * mobile, top bar with the language switch. Pages render into <Outlet />.
 */
export function DashboardLayout() {
  const { t } = useTranslation()
  const lang = useLanguage()
  const user = useAuthStore((s) => s.user)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const location = useLocation()

  // Navigating closes the drawer (back/forward included).
  useEffect(() => {
    setDrawerOpen(false)
  }, [location.pathname])

  // Growing to desktop width hides the drawer with CSS; close it so focus and scroll
  // aren't left trapped in an invisible dialog.
  useEffect(() => {
    if (!drawerOpen || typeof window.matchMedia !== 'function') return
    const desktop = window.matchMedia('(min-width: 1024px)')
    const onChange = () => {
      if (desktop.matches) setDrawerOpen(false)
    }
    onChange()
    desktop.addEventListener('change', onChange)
    return () => desktop.removeEventListener('change', onChange)
  }, [drawerOpen])

  // The route guard guarantees a user; this only covers the instant of sign-out.
  if (!user) return null

  return (
    <div className="min-h-screen bg-surface-soft">
      <a
        href="#main-content"
        className="sr-only z-[120] rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        {t('common.skipToContent')}
      </a>

      <aside className={`fixed inset-y-0 left-0 z-30 hidden flex-col border-r border-line bg-white lg:flex ${SIDEBAR_WIDTH}`}>
        <SidebarContent user={user} />
      </aside>

      {drawerOpen && <MobileDrawer user={user} onClose={() => setDrawerOpen(false)} />}

      <div className="lg:pl-[264px]">
        <header className="sticky top-0 z-20 flex h-[68px] items-center justify-between gap-3 border-b border-line bg-white/90 px-4 backdrop-blur-md sm:px-6 lg:px-10">
          <div className="flex min-w-0 items-center gap-2 lg:hidden">
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              aria-label={t('common.openMenu')}
              aria-expanded={drawerOpen}
              className="-ml-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-ink hover:bg-surface-soft focus-visible:outline-2 focus-visible:outline-brand"
            >
              <Menu aria-hidden className="h-5 w-5" />
            </button>
            <Brand user={user} />
          </div>
          <div className="hidden items-center gap-3 lg:flex">
            <Badge tone="brand">{t(`roles.${user.role}`)}</Badge>
            <span className="text-sm text-slate">{formatLongDate(new Date(), lang)}</span>
          </div>
          <LanguageToggle />
        </header>

        <main id="main-content" tabIndex={-1} className="mx-auto w-full max-w-[1200px] px-4 py-6 outline-none sm:px-6 lg:px-10 lg:py-8">
          <Suspense fallback={<LoadingBlock lines={4} />}>
            <Outlet />
          </Suspense>
        </main>
      </div>
    </div>
  )
}
