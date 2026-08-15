import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import { AuthLayout } from './AuthLayout'
import { loginSchema, type LoginValues } from './schemas'
import { authApi } from './api'
import { routeForUser } from './redirect'
import { useAuthStore } from '@/stores/auth'
import { Input } from '@/components/ui/Input'
import { PasswordInput } from '@/components/ui/PasswordInput'
import { Button } from '@/components/ui/Button'
import { FormError } from '@/components/ui/FormError'

export function LoginPage() {
  const navigate = useNavigate()
  const setAuth = useAuthStore((s) => s.setAuth)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginValues>({ resolver: zodResolver(loginSchema) })

  const mutation = useMutation({
    mutationFn: (values: LoginValues) => authApi.login(values),
    onSuccess: ({ data }) => {
      setAuth(data.user, data.accessToken, data.refreshToken)
      navigate(routeForUser(data.user), { replace: true })
    },
  })

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Log in to access your health records."
      footer={
        <>
          New to HealthNexus?{' '}
          <Link to="/register" className="font-semibold text-brand hover:underline">
            Create an account
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="space-y-4" noValidate>
        {mutation.isError && <FormError error={mutation.error} />}

        <Input
          label="Email or phone"
          placeholder="you@example.com or 017XXXXXXXX"
          autoComplete="username"
          error={errors.identifier?.message}
          {...register('identifier')}
        />

        <div>
          <PasswordInput
            label="Password"
            placeholder="Your password"
            autoComplete="current-password"
            error={errors.password?.message}
            {...register('password')}
          />
          <div className="mt-2 text-right">
            <Link to="/forgot-password" className="text-xs font-semibold text-brand hover:underline">
              Forgot password?
            </Link>
          </div>
        </div>

        <Button type="submit" size="lg" className="w-full" disabled={mutation.isPending}>
          {mutation.isPending ? 'Logging in…' : 'Log in'}
        </Button>
      </form>
    </AuthLayout>
  )
}
