import { Suspense, useEffect, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { createPortal } from 'react-dom'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { LogOut, Menu, X } from 'lucide-react'
import { Logo } from '@/components/brand/icons'
import { LanguageToggle } from '@/components/i18n/LanguageToggle'
import { Badge } from '@/components/ui/Badge'
import { LoadingBlock } from '@/components/ui/Feedback'
import { useDialogFocus } from '@/components/ui/useDialogFocus'
import { NAVIGATION, ROLE_HOME, type NavBadge } from '@/app/navigation'
import { displayName } from '@/features/account/displayName'
import { useLogout } from '@/features/auth/useLogout'
import { adminKeys } from '@/features/admin/api'
import { api } from '@/lib/api'
import { formatLongDate, formatNumber, initials } from '@/lib/format'
import { useLanguage } from '@/i18n/useLanguage'
import { NotificationBell } from '@/features/patient/NotificationBell'
import { AssistantLauncher } from '@/features/patient/assistant/AssistantLauncher'
import { AssistantSessionProvider } from '@/features/patient/assistant/AssistantSession'
import { useAuthStore } from '@/stores/auth'
import type { AuthUser, Role } from '@/types/api'

const SIDEBAR_WIDTH = 'lg:w-66'

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

/**
 * Live counts for nav entries. Admin: applications waiting for verification (shares
 * the admin dashboard's cache entry, so the badge and the page always agree).
 */
function useNavBadges(role: Role): Partial<Record<NavBadge, number>> {
  const pending = useQuery({
    queryKey: adminKeys.dashboard(),
    queryFn: () => api.get<{ pending: { doctors: number; labs: number } }>('/admin/dashboard'),
    select: (res) => res.data.pending.doctors + res.data.pending.labs,
    enabled: role === 'admin',
    refetchInterval: 60_000,
  })
  return { pendingVerifications: pending.data }
}

function NavList({ user, onNavigate }: { user: AuthUser; onNavigate?: () => void }) {
  const { t } = useTranslation()
  const lang = useLanguage()
  const badges = useNavBadges(user.role)
  return (
    <nav aria-label={t('dashboard.navLabel')} className="flex-1 overflow-y-auto px-3 py-4">
      <ul className="space-y-1">
        {NAVIGATION[user.role].map(({ to, label, icon: Icon, end, badge }) => {
          const count = badge ? (badges[badge] ?? 0) : 0
          return (
          <li key={to}>
            <NavLink
              to={to}
              end={end}
              onClick={onNavigate}
              className={({ isActive }) =>
                `group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-brand ${
                  isActive ? 'bg-brand/8 text-brand' : 'text-slate hover:bg-surface-soft hover:text-ink'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && <span aria-hidden className="absolute inset-y-2 left-0 w-1 rounded-r-full bg-brand" />}
                  <Icon aria-hidden className="h-4.5 w-4.5 shrink-0" />
                  {t(label)}
                  {count > 0 && (
                    <>
                      <span aria-hidden className="ml-auto min-w-5.5 rounded-full bg-amber-500 px-1.5 py-0.5 text-center text-[11px] font-bold leading-none text-white">
                        {formatNumber(count, lang)}
                      </span>
                      <span className="sr-only">, {t('dashboard.nav.waiting', { count: formatNumber(count, lang) })}</span>
                    </>
                  )}
                </>
              )}
            </NavLink>
          </li>
          )
        })}
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
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-brand to-teal text-xs font-bold text-white"
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
        <LogOut aria-hidden className="h-4.5 w-4.5" />
        {logout.isPending ? t('common.loggingOut') : t('common.logout')}
      </button>
    </div>
  )
}

function SidebarContent({ user, onNavigate }: { user: AuthUser; onNavigate?: () => void }) {
  return (
    <>
      <div className="flex h-17 items-center border-b border-line px-5">
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
    <div className="fixed inset-0 z-90 lg:hidden">
      <div aria-hidden className="absolute inset-0 bg-navy/40 backdrop-blur-[2px]" onClick={onClose} />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={t('dashboard.navLabel')}
        tabIndex={-1}
        className="relative flex h-full w-[82%] max-w-75 flex-col bg-white shadow-[0_0_48px_rgba(15,27,45,0.25)] outline-none"
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

  const isPatient = user.role === 'patient'
  // The corner button opens the Health Assistant everywhere except on its own page.
  const hasLauncher = isPatient && !location.pathname.startsWith('/patient/assistant')

  const shell = (
    <div className="min-h-screen bg-surface-soft">
      <a
        href="#main-content"
        className="sr-only z-120 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        {t('common.skipToContent')}
      </a>

      <aside className={`fixed inset-y-0 left-0 z-30 hidden flex-col border-r border-line bg-white lg:flex ${SIDEBAR_WIDTH}`}>
        <SidebarContent user={user} />
      </aside>

      {drawerOpen && <MobileDrawer user={user} onClose={() => setDrawerOpen(false)} />}

      <div className="lg:pl-66">
        <header className="sticky top-0 z-20 flex h-17 items-center justify-between gap-3 border-b border-line bg-white/90 px-4 backdrop-blur-md sm:px-6 lg:px-10">
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
          <div className="flex items-center gap-1 sm:gap-2">
            {user.role === 'patient' && <NotificationBell />}
            <LanguageToggle />
          </div>
        </header>

        <main
          id="main-content"
          tabIndex={-1}
          // Room at the bottom so the corner button never covers the last controls.
          className={`mx-auto w-full max-w-300 px-4 py-6 outline-none sm:px-6 lg:px-10 lg:py-8 ${hasLauncher ? 'pb-28 lg:pb-28' : ''}`}
        >
          <Suspense fallback={<LoadingBlock lines={4} />}>
            <Outlet />
          </Suspense>
        </main>
      </div>

      {hasLauncher && <AssistantLauncher />}
    </div>
  )

  // One Health Assistant conversation per signed-in patient, shared by every page.
  return isPatient ? (
    <AssistantSessionProvider key={user.id} userId={user.id}>
      {shell}
    </AssistantSessionProvider>
  ) : (
    shell
  )
}
