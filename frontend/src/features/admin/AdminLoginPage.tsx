import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, Info, LockKeyhole, ShieldCheck } from 'lucide-react'
import { authApi } from '@/features/auth/api'
import { loginSchema, type LoginValues } from '@/features/auth/schemas'
import { fromState, routeForUser } from '@/features/auth/redirect'
import { useSignOutReason } from '@/features/auth/useSignOutReason'
import { useAuthStore } from '@/stores/auth'
import { LanguageToggle } from '@/components/i18n/LanguageToggle'
import { Input } from '@/components/ui/Input'
import { PasswordInput } from '@/components/ui/PasswordInput'
import { Button } from '@/components/ui/Button'
import { FormError } from '@/components/ui/FormError'

/** Hairline grid that fades toward the edges, behind the console card. */
const GRID_STYLE = {
  backgroundImage:
    'linear-gradient(to right, rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.05) 1px, transparent 1px)',
  backgroundSize: '56px 56px',
  maskImage: 'radial-gradient(ellipse 60% 55% at 50% 45%, #000 25%, transparent 75%)',
  WebkitMaskImage: 'radial-gradient(ellipse 60% 55% at 50% 45%, #000 25%, transparent 75%)',
}

/**
 * The admin console's own entrance. The server is asked to accept admins only, and
 * answers anyone else exactly like a wrong password.
 */
export function AdminLoginPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const setAuth = useAuthStore((s) => s.setAuth)
  const signOutReason = useSignOutReason()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginValues>({ resolver: zodResolver(loginSchema) })

  const mutation = useMutation({
    mutationFn: (values: LoginValues) => authApi.login({ ...values, portal: 'admin' }),
    onSuccess: ({ data }) => {
      setAuth(data.user, data.accessToken, data.refreshToken)
      navigate(routeForUser(data.user, fromState(location.state)), { replace: true })
    },
  })

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-[#06142a] text-white">
      <div aria-hidden className="pointer-events-none absolute inset-0" style={GRID_STYLE} />
      <div aria-hidden className="pointer-events-none absolute -left-40 -top-40 h-112 w-md rounded-full bg-brand/40 blur-[120px]" />
      <div aria-hidden className="pointer-events-none absolute -bottom-40 -right-32 hidden h-96 w-[24rem] rounded-full bg-teal/25 blur-[120px] sm:block" />

      <header className="relative z-10 flex items-center justify-between gap-4 px-4 py-5 sm:px-8">
        <Link
          to="/"
          className="inline-flex items-center gap-2 rounded-lg text-sm font-medium text-white/60 transition hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-teal"
        >
          <ArrowLeft aria-hidden className="h-4 w-4" />
          {t('admin.login.back')}
        </Link>
        <LanguageToggle tone="dark" />
      </header>

      <main id="main-content" className="relative z-10 flex flex-1 items-center justify-center px-4 pb-16 pt-2">
        <div className="w-full max-w-105">
          <div className="mb-7 flex flex-col items-center text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-linear-to-br from-brand to-teal shadow-[0_12px_40px_rgba(11,92,173,0.55)] ring-1 ring-white/20">
              <ShieldCheck aria-hidden className="h-7 w-7" />
            </span>
            <p className="mt-4 text-lg font-extrabold tracking-tight">
              HealthNexus <span className="text-teal">BD</span>
            </p>
            <span className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-teal/30 bg-teal/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-teal [:lang(bn)_&]:text-xs [:lang(bn)_&]:tracking-normal">
              <LockKeyhole aria-hidden className="h-3 w-3" />
              {t('admin.login.badge')}
            </span>
          </div>

          <div className="rounded-3xl bg-white p-6 text-body shadow-[0_32px_80px_rgba(0,0,0,0.5)] ring-1 ring-white/10 sm:p-9">
            <h1 className="text-[22px] font-black tracking-tight text-ink">{t('admin.login.title')}</h1>
            <p className="mt-1 text-sm text-slate">{t('admin.login.subtitle')}</p>

            <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="mt-6 space-y-4" noValidate>
              {signOutReason && !mutation.isError && (
                <div
                  role="status"
                  className={`rounded-xl border px-4 py-3 text-sm font-medium ${
                    signOutReason === 'suspended'
                      ? 'border-red-200 bg-red-50 text-red-600'
                      : 'border-amber-200 bg-amber-50 text-amber-700'
                  }`}
                >
                  {signOutReason === 'suspended' ? t('errors.accountSuspended') : t('errors.sessionExpired')}
                </div>
              )}
              {mutation.isError && <FormError error={mutation.error} />}

              <Input
                type="email"
                label={t('admin.login.emailLabel')}
                placeholder={t('admin.login.emailPlaceholder')}
                autoComplete="username"
                error={errors.identifier?.message}
                {...register('identifier')}
              />

              <div>
                <PasswordInput
                  label={t('auth.login.passwordLabel')}
                  placeholder={t('auth.login.passwordPlaceholder')}
                  autoComplete="current-password"
                  error={errors.password?.message}
                  {...register('password')}
                />
                <div className="mt-2 text-right">
                  <Link to="/forgot-password" className="text-xs font-semibold text-brand hover:underline">
                    {t('auth.login.forgot')}
                  </Link>
                </div>
              </div>

              <p className="flex gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-3 text-[13px] leading-snug text-amber-800">
                <Info aria-hidden className="mt-px h-4 w-4 shrink-0" />
                {t('admin.login.notice')}
              </p>

              <Button type="submit" size="lg" className="w-full" disabled={mutation.isPending}>
                {mutation.isPending ? t('admin.login.submitting') : t('admin.login.submit')}
              </Button>
            </form>
          </div>

          <p className="mt-6 text-center text-sm text-white/60">
            {t('admin.login.notAdmin')}{' '}
            <Link
              to="/login"
              className="rounded font-semibold text-teal hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal"
            >
              {t('admin.login.mainSignIn')}
            </Link>
          </p>
        </div>
      </main>
    </div>
  )
}
