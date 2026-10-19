import type { ReactNode } from 'react'
import { Link, isRouteErrorResponse, useRouteError } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { FileQuestion, TriangleAlert } from 'lucide-react'
import { Logo } from '@/components/brand/icons'
import { LanguageToggle } from '@/components/i18n/LanguageToggle'
import { Button } from '@/components/ui/Button'
import { useAuthStore } from '@/stores/auth'
import { routeForUser } from '@/features/auth/redirect'

function Shell({ icon, title, body, actions }: { icon: ReactNode; title: string; body: string; actions: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-surface-soft">
      <header className="flex items-center justify-between px-6 py-5">
        <Link to="/" className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-[9px] bg-brand text-white">
            <Logo size={18} />
          </span>
          <span className="text-[15px] font-extrabold tracking-tight text-brand">
            HealthNexus <span className="text-teal">BD</span>
          </span>
        </Link>
        <LanguageToggle />
      </header>
      <main className="flex flex-1 items-center justify-center px-6 pb-16">
        <div className="w-full max-w-md text-center">
          <span className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-brand shadow-card">
            {icon}
          </span>
          <h1 className="text-2xl font-black tracking-tight text-ink">{title}</h1>
          <p className="mt-2 text-sm text-slate">{body}</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">{actions}</div>
        </div>
      </main>
    </div>
  )
}

function HomeLink() {
  const { t } = useTranslation()
  const user = useAuthStore((s) => (s.accessToken && s.user ? s.user : null))
  return (
    <Link
      to={user ? routeForUser(user) : '/'}
      className="inline-flex items-center justify-center rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white shadow-brand transition hover:bg-brand-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
    >
      {t('errors.goHome')}
    </Link>
  )
}

export function NotFoundPage() {
  const { t } = useTranslation()
  return (
    <Shell
      icon={<FileQuestion aria-hidden className="h-8 w-8" />}
      title={t('errors.notFoundTitle')}
      body={t('errors.notFoundBody')}
      actions={<HomeLink />}
    />
  )
}

/** Router-level error boundary: a render crash shows this instead of a blank page. */
export function RouteError() {
  const { t } = useTranslation()
  const error = useRouteError()
  if (isRouteErrorResponse(error) && error.status === 404) return <NotFoundPage />
  return (
    <Shell
      icon={<TriangleAlert aria-hidden className="h-8 w-8 text-red-500" />}
      title={t('errors.crashTitle')}
      body={t('errors.crashBody')}
      actions={
        <>
          <Button onClick={() => window.location.reload()}>{t('errors.reload')}</Button>
          <HomeLink />
        </>
      }
    />
  )
}
