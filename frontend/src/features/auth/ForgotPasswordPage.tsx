import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { AuthLayout } from './AuthLayout'
import { forgotSchema, resetSchema, type ForgotValues, type ResetValues } from './schemas'
import { authApi } from './api'
import { Input } from '@/components/ui/Input'
import { PasswordInput } from '@/components/ui/PasswordInput'
import { Button } from '@/components/ui/Button'
import { FormError } from '@/components/ui/FormError'

type Step = 'request' | 'reset' | 'done'

export function ForgotPasswordPage() {
  const [step, setStep] = useState<Step>('request')
  const [email, setEmail] = useState('')

  return (
    <AuthLayout
      title={step === 'done' ? 'Password updated' : 'Reset your password'}
      subtitle={
        step === 'request'
          ? "Enter your email and we'll send a reset code."
          : step === 'reset'
            ? `Enter the 6-digit code sent to ${email}.`
            : 'You can now log in with your new password.'
      }
      footer={
        <Link to="/login" className="font-semibold text-brand hover:underline">
          ← Back to log in
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
        <Link to="/login">
          <Button size="lg" className="w-full">
            Go to log in
          </Button>
        </Link>
      )}
    </AuthLayout>
  )
}

function RequestForm({ onSent }: { onSent: (email: string) => void }) {
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
        label="Email"
        type="email"
        placeholder="you@example.com"
        autoComplete="email"
        error={errors.email?.message}
        {...register('email')}
      />
      <Button type="submit" size="lg" className="w-full" disabled={mutation.isPending}>
        {mutation.isPending ? 'Sending…' : 'Send reset code'}
      </Button>
    </form>
  )
}

function ResetForm({ email, onDone }: { email: string; onDone: () => void }) {
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
        label="6-digit code"
        inputMode="numeric"
        maxLength={6}
        placeholder="••••••"
        error={errors.code?.message}
        {...register('code')}
      />
      <PasswordInput
        label="New password"
        placeholder="At least 8 characters"
        autoComplete="new-password"
        error={errors.newPassword?.message}
        {...register('newPassword')}
      />
      <Button type="submit" size="lg" className="w-full" disabled={mutation.isPending}>
        {mutation.isPending ? 'Updating…' : 'Update password'}
      </Button>
    </form>
  )
}
