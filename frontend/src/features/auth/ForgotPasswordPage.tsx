import { useEffect, useState } from 'react'
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
import { parseAccount, type AccountTarget } from '@/lib/identifier'
import { formatNumber } from '@/lib/format'
import { useLanguage } from '@/i18n/useLanguage'

type Step = 'request' | 'reset' | 'done'

/** The server sends at most one code a minute per account; the button waits the same. */
const RESEND_AFTER_SECONDS = 60

export function ForgotPasswordPage() {
  const { t } = useTranslation()
  const [step, setStep] = useState<Step>('request')
  const [target, setTarget] = useState<AccountTarget | null>(null)

  const subtitle =
    step === 'request'
      ? t('auth.forgot.subtitleRequest')
      : step === 'done'
        ? t('auth.forgot.subtitleDone')
        : target?.kind === 'phone'
          ? t('auth.forgot.subtitleResetPhone', { target: target.value })
          : t('auth.forgot.subtitleResetEmail', { target: target?.value ?? '' })

  return (
    <AuthLayout
      title={step === 'done' ? t('auth.forgot.titleDone') : t('auth.forgot.titleRequest')}
      subtitle={subtitle}
      footer={
        <Link to="/login" className="font-semibold text-brand hover:underline">
          {t('auth.forgot.backToLogin')}
        </Link>
      }
    >
      {step === 'request' && (
        <RequestForm
          defaultValue={target?.value}
          onSent={(sent) => {
            setTarget(sent)
            setStep('reset')
          }}
        />
      )}
      {step === 'reset' && target && (
        <ResetForm target={target} onDone={() => setStep('done')} onChangeTarget={() => setStep('request')} />
      )}
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

function RequestForm({ defaultValue, onSent }: { defaultValue?: string; onSent: (target: AccountTarget) => void }) {
  const { t } = useTranslation()
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotValues>({ resolver: zodResolver(forgotSchema), defaultValues: { identifier: defaultValue ?? '' } })

  const mutation = useMutation({
    mutationFn: (target: AccountTarget) => authApi.forgotPassword(target.value),
    onSuccess: (_res, target) => onSent(target),
  })

  const submit = (values: ForgotValues) => {
    const target = parseAccount(values.identifier)
    if (target) mutation.mutate(target)
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-4" noValidate>
      {mutation.isError && <FormError error={mutation.error} />}
      <Input
        label={t('auth.forgot.identifierLabel')}
        placeholder={t('auth.forgot.identifierPlaceholder')}
        autoComplete="username"
        hint={t('auth.forgot.identifierHint')}
        error={errors.identifier?.message}
        {...register('identifier')}
      />
      <Button type="submit" size="lg" className="w-full" disabled={mutation.isPending}>
        {mutation.isPending ? t('auth.forgot.sending') : t('auth.forgot.send')}
      </Button>
    </form>
  )
}

/** Seconds left before the code may be sent again; restart() begins a new wait. */
function useResendTimer() {
  const [left, setLeft] = useState(RESEND_AFTER_SECONDS)
  useEffect(() => {
    if (left <= 0) return
    const timer = setTimeout(() => setLeft((s) => s - 1), 1000)
    return () => clearTimeout(timer)
  }, [left])
  return { left, restart: () => setLeft(RESEND_AFTER_SECONDS) }
}

function ResetForm({
  target,
  onDone,
  onChangeTarget,
}: {
  target: AccountTarget
  onDone: () => void
  onChangeTarget: () => void
}) {
  const { t } = useTranslation()
  const lang = useLanguage()
  const timer = useResendTimer()
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetValues>({ resolver: zodResolver(resetSchema) })

  const mutation = useMutation({
    mutationFn: (values: ResetValues) =>
      authApi.resetPassword({ identifier: target.value, code: values.code, newPassword: values.newPassword }),
    onSuccess: onDone,
  })

  const resend = useMutation({
    mutationFn: () => authApi.forgotPassword(target.value),
    onSuccess: timer.restart,
  })

  return (
    <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="space-y-4" noValidate>
      {mutation.isError && <FormError error={mutation.error} />}
      {resend.isError && <FormError error={resend.error} />}
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

      <div className="flex flex-col items-center gap-1.5 pt-1 text-[13px]">
        <p aria-live="polite" className="min-h-5 text-slate">
          {resend.isSuccess && timer.left > RESEND_AFTER_SECONDS - 5 ? t('auth.forgot.resent') : ''}
        </p>
        {timer.left > 0 ? (
          <span className="text-slate">{t('auth.forgot.resendIn', { seconds: formatNumber(timer.left, lang) })}</span>
        ) : (
          <button
            type="button"
            onClick={() => resend.mutate()}
            disabled={resend.isPending}
            className="font-semibold text-brand hover:underline disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          >
            {resend.isPending ? t('auth.forgot.sending') : t('auth.forgot.resend')}
          </button>
        )}
        <button
          type="button"
          onClick={onChangeTarget}
          className="font-semibold text-slate hover:text-ink hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
        >
          {t('auth.forgot.changeTarget')}
        </button>
      </div>
    </form>
  )
}
