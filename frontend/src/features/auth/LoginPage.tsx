import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { AuthLayout } from './AuthLayout'
import { loginSchema, type LoginValues } from './schemas'
import { authApi } from './api'
import { fromState, routeForUser } from './redirect'
import { useAuthStore } from '@/stores/auth'
import { Input } from '@/components/ui/Input'
import { PasswordInput } from '@/components/ui/PasswordInput'
import { Button } from '@/components/ui/Button'
import { FormError } from '@/components/ui/FormError'

export function LoginPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const setAuth = useAuthStore((s) => s.setAuth)
  const clearSignOutReason = useAuthStore((s) => s.clearSignOutReason)
  // Read once and keep it for this visit; cleared in an effect so StrictMode's double
  // render can't lose it.
  const [signOutReason] = useState(() => useAuthStore.getState().signOutReason)
  useEffect(() => {
    if (signOutReason) clearSignOutReason()
  }, [signOutReason, clearSignOutReason])

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginValues>({ resolver: zodResolver(loginSchema) })

  const mutation = useMutation({
    mutationFn: (values: LoginValues) => authApi.login(values),
    onSuccess: ({ data }) => {
      setAuth(data.user, data.accessToken, data.refreshToken)
      navigate(routeForUser(data.user, fromState(location.state)), { replace: true })
    },
  })

  return (
    <AuthLayout
      title={t('auth.login.title')}
      subtitle={t('auth.login.subtitle')}
      footer={
        <>
          {t('auth.login.newHere')}{' '}
          <Link to="/register" className="font-semibold text-brand hover:underline">
            {t('auth.login.createAccount')}
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="space-y-4" noValidate>
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
          label={t('auth.login.identifierLabel')}
          placeholder={t('auth.login.identifierPlaceholder')}
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

        <Button type="submit" size="lg" className="w-full" disabled={mutation.isPending}>
          {mutation.isPending ? t('auth.login.submitting') : t('auth.login.submit')}
        </Button>
      </form>
    </AuthLayout>
  )
}
