import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { AuthLayout } from './AuthLayout'
import { forgotSchema, resetSchema, type ForgotValues, type ResetValues } from './schemas'
import { authApi } from './api'
import { Input } from '@/components/ui/Input'
import { PasswordInput } from '@/components/ui/PasswordInput'
import { Button } from '@/components/ui/Button'
import { FormError } from '@/components/ui/FormError'

type Step = 'request' | 'reset' | 'done'

export function ForgotPasswordPage() {
  const { t } = useTranslation()
  const [step, setStep] = useState<Step>('request')
  const [email, setEmail] = useState('')

  return (
    <AuthLayout
      title={step === 'done' ? t('auth.forgot.titleDone') : t('auth.forgot.titleRequest')}
      subtitle={
        step === 'request'
          ? t('auth.forgot.subtitleRequest')
          : step === 'reset'
            ? t('auth.forgot.subtitleReset', { email })
            : t('auth.forgot.subtitleDone')
      }
      footer={
        <Link to="/login" className="font-semibold text-brand hover:underline">
          {t('auth.forgot.backToLogin')}
        </Link>
      }
    >
      {step === 'request' && (
        <RequestForm
          onSent={(sentEmail) => {
            setEmail(sentEmail)
            setStep('reset')
          }}
        />
      )}
      {step === 'reset' && <ResetForm email={email} onDone={() => setStep('done')} />}
      {step === 'done' && (
        <Link
          to="/login"
          className="inline-flex w-full items-center justify-center rounded-xl bg-brand px-7 py-3 text-[15px] font-semibold text-white shadow-brand transition-all duration-150 hover:-translate-y-0.5 hover:bg-brand-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
        >
          {t('auth.forgot.goToLogin')}
        </Link>
      )}
    </AuthLayout>
  )
}

function RequestForm({ onSent }: { onSent: (email: string) => void }) {
  const { t } = useTranslation()
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotValues>({ resolver: zodResolver(forgotSchema) })

  const mutation = useMutation({
    mutationFn: (values: ForgotValues) => authApi.forgotPassword(values.email),
    onSuccess: (_res, values) => onSent(values.email),
  })

  return (
    <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="space-y-4" noValidate>
      {mutation.isError && <FormError error={mutation.error} />}
      <Input
        label={t('auth.forgot.emailLabel')}
        type="email"
        placeholder={t('auth.forgot.emailPlaceholder')}
        autoComplete="email"
        error={errors.email?.message}
        {...register('email')}
      />
      <Button type="submit" size="lg" className="w-full" disabled={mutation.isPending}>
        {mutation.isPending ? t('auth.forgot.sending') : t('auth.forgot.send')}
      </Button>
    </form>
  )
}

function ResetForm({ email, onDone }: { email: string; onDone: () => void }) {
  const { t } = useTranslation()
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetValues>({ resolver: zodResolver(resetSchema) })

  const mutation = useMutation({
    mutationFn: (values: ResetValues) =>
      authApi.resetPassword({ email, code: values.code, newPassword: values.newPassword }),
    onSuccess: onDone,
  })

  return (
    <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="space-y-4" noValidate>
      {mutation.isError && <FormError error={mutation.error} />}
      <Input
        label={t('auth.forgot.codeLabel')}
        autoComplete="one-time-code"
        inputMode="numeric"
        maxLength={6}
        placeholder="••••••"
        error={errors.code?.message}
        {...register('code')}
      />
      <PasswordInput
        label={t('auth.forgot.newPassword')}
        placeholder={t('auth.forgot.newPasswordPlaceholder')}
        autoComplete="new-password"
        error={errors.newPassword?.message}
        {...register('newPassword')}
      />
      <Button type="submit" size="lg" className="w-full" disabled={mutation.isPending}>
        {mutation.isPending ? t('auth.forgot.updating') : t('auth.forgot.update')}
      </Button>
    </form>
  )
}
