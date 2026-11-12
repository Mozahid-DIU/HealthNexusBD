import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Check, FlaskConical, KeyRound, ShieldCheck, UserRound } from 'lucide-react'
import { PageHeader } from '@/components/layout/dashboard/PageHeader'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { ErrorState, LoadingBlock } from '@/components/ui/Feedback'
import { FormError } from '@/components/ui/FormError'
import { OtpInput } from '@/components/ui/OtpInput'
import { Textarea } from '@/components/ui/Textarea'
import { ApiError } from '@/lib/api'
import { formatNumber } from '@/lib/format'
import { useLanguage } from '@/i18n/useLanguage'
import { useNow } from '@/lib/useNow'
import { toast } from '@/stores/toast'
import { doctorApi, doctorKeys } from './api'
import { parseIdentifier } from '@/lib/identifier'
import { formatCountdown } from './helpers'
import { PatientSearchForm } from '@/features/clinical/PatientSearchForm'
import { useUhidInUrl } from '@/features/clinical/useUhidInUrl'
import type { AccessRequest, SearchResult } from './types'

const STEPS = ['doctor.find.stepFind', 'doctor.find.stepCode', 'doctor.find.stepChart'] as const

function Stepper({ step }: { step: 0 | 1 | 2 }) {
  const { t } = useTranslation()
  return (
    <ol className="mb-6 flex items-center gap-2 text-sm" aria-label={t('doctor.find.title')}>
      {STEPS.map((key, i) => {
        const done = i < step
        const current = i === step
        return (
          <li key={key} className="flex flex-1 items-center gap-2" aria-current={current ? 'step' : undefined}>
            <span
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                done ? 'bg-teal text-white' : current ? 'bg-brand text-white' : 'bg-slate-200 text-slate-500'
              }`}
            >
              {done ? <Check aria-hidden className="h-4 w-4" /> : i + 1}
            </span>
            {/* Names stay readable to screen readers on every screen; visible from sm up. */}
            <span className={`sr-only font-semibold sm:not-sr-only ${current ? 'text-ink' : 'text-slate'}`}>{t(key)}</span>
            {done && <span className="sr-only">{t('doctor.find.stepDone')}</span>}
            {i < STEPS.length - 1 && <span aria-hidden className={`h-0.5 flex-1 rounded ${done ? 'bg-teal' : 'bg-slate-200'}`} />}
          </li>
        )
      })}
    </ol>
  )
}

function PatientCard({ patient }: { patient: SearchResult }) {
  const { t } = useTranslation()
  const gender = patient.gender === 'male' || patient.gender === 'female' || patient.gender === 'other' ? t(`clinical.${patient.gender}`) : null
  return (
    <div className="flex items-center gap-4">
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand/[0.08] text-brand">
        <UserRound aria-hidden className="h-6 w-6" />
      </span>
      <div className="min-w-0">
        <p className="truncate text-lg font-black text-ink">{patient.fullName}</p>
        <p className="flex flex-wrap gap-x-3 text-sm text-slate">
          <span className="font-mono">{patient.uhid}</span>
          {gender && <span>{gender}</span>}
          <span>
            {t('doctor.find.phone')}: <span className="font-mono">{patient.phone}</span>
          </span>
        </p>
      </div>
    </div>
  )
}

/** Step 2: the patient reads the code from their phone; the doctor enters it. */
function CodeStep({
  request,
  patient,
  onVerified,
  onResend,
  resending,
  resendError,
}: {
  request: AccessRequest
  patient: SearchResult
  onVerified: (expiresAt: string) => void
  onResend: () => void
  resending: boolean
  resendError: unknown
}) {
  const { t } = useTranslation()
  const now = useNow(1000)
  const [code, setCode] = useState('')
  const msLeft = new Date(request.expiresAt).getTime() - now
  const expired = msLeft <= 0

  const verify = useMutation({
    mutationFn: (value: string) => doctorApi.verifyAccess({ requestId: request.requestId, code: value }),
    onSuccess: (res) => onVerified(res.data.expiresAt),
    onError: () => setCode(''),
  })
  const locked = verify.error instanceof ApiError && verify.error.status === 429

  const submit = (value: string) => {
    if (value.length === 6 && !expired && !verify.isPending) verify.mutate(value)
  }

  return (
    <div className="space-y-5 text-center">
      <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand/[0.08] text-brand">
        <KeyRound aria-hidden className="h-7 w-7" />
      </span>
      <div>
        <h2 className="text-lg font-black text-ink">{t('doctor.find.codeTitle')}</h2>
        <p className="mx-auto mt-1 max-w-md text-sm text-slate">{t('doctor.find.codeBody', { phone: patient.phone })}</p>
      </div>

      {request.devOtp && (
        <div className="mx-auto flex max-w-md flex-wrap items-center justify-center gap-3 rounded-xl border border-dashed border-teal/40 bg-teal/[0.06] px-4 py-3 text-sm">
          <FlaskConical aria-hidden className="h-4 w-4 text-teal" />
          <span>
            <strong className="text-teal">{t('doctor.find.demoTitle')}:</strong> {t('doctor.find.demoBody', { code: request.devOtp })}
          </span>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setCode(request.devOtp!)
              submit(request.devOtp!)
            }}
          >
            {t('doctor.find.useCode')}
          </Button>
        </div>
      )}

      <OtpInput
        value={code}
        onChange={setCode}
        onComplete={submit}
        label={t('doctor.find.codeLabel')}
        autoFocus
        invalid={verify.isError}
        disabled={expired || locked}
        // Read-only (not disabled) while checking, so focus stays in the boxes for a retry.
        readOnly={verify.isPending}
      />

      {/* The ticking timer is visual only; screen readers hear just the expiry. */}
      <p className={`text-sm font-semibold ${expired ? 'text-red-600' : 'text-slate'}`}>
        {expired ? t('doctor.find.codeExpired') : t('doctor.find.codeExpiresIn', { time: formatCountdown(msLeft) })}
      </p>
      <p role="status" className="sr-only">
        {expired ? t('doctor.find.codeExpired') : ''}
      </p>

      {verify.isError && <FormError error={verify.error} />}
      {resendError != null && !resending && <FormError error={resendError} />}

      <div className="flex flex-col-reverse justify-center gap-2 sm:flex-row">
        {/* No new code while one is being checked: it would leave the patient with two. */}
        <Button variant="ghost" onClick={onResend} disabled={resending || verify.isPending}>
          {resending ? t('doctor.find.sending') : t('doctor.find.resend')}
        </Button>
        <Button onClick={() => submit(code)} disabled={code.length !== 6 || expired || locked || verify.isPending}>
          {verify.isPending ? t('doctor.find.verifying') : t('doctor.find.verify')}
        </Button>
      </div>
    </div>
  )
}

/**
 * Search → consent code → chart, in one guided flow. The search term lives in the URL
 * (?q=) so the home search box can hand off to this page and Back works naturally.
 */
export function FindPatientPage() {
  const { t } = useTranslation()
  const lang = useLanguage()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [params, setParams] = useSearchParams()
  const q = params.get('q') ?? ''
  const query = parseIdentifier(q)
  const [reason, setReason] = useState('')
  const [request, setRequest] = useState<AccessRequest | null>(null)

  const search = useQuery({
    queryKey: doctorKeys.search(q),
    queryFn: () => doctorApi.search(query!),
    select: (res) => res.data,
    enabled: query !== null,
    retry: false,
    staleTime: 0,
  })
  const patient = search.data

  useUhidInUrl(q, query, patient?.uhid, doctorKeys.search)

  const send = useMutation({
    mutationFn: () => doctorApi.requestAccess({ uhid: patient!.uhid, ...(reason.trim() ? { reason: reason.trim() } : {}) }),
    onSuccess: (res) => setRequest(res.data),
    // 409: access was granted meanwhile (e.g. another tab) — refresh to offer "Open chart".
    onError: (error) => {
      if (error instanceof ApiError && error.status === 409) void search.refetch()
    },
  })

  const onVerified = (expiresAt: string) => {
    const minutes = Math.max(1, Math.round((new Date(expiresAt).getTime() - Date.now()) / 60_000))
    toast.success(t('doctor.find.granted', { minutes: formatNumber(minutes, lang) }))
    // Anything cached from an earlier, ended session must not flash as "access ended".
    queryClient.removeQueries({ queryKey: doctorKeys.patient(patient!.patientId) })
    void queryClient.invalidateQueries({ queryKey: doctorKeys.search() })
    void queryClient.invalidateQueries({ queryKey: doctorKeys.patients() })
    navigate(`/doctor/patients/${patient!.patientId}`)
  }

  const startOver = () => {
    setRequest(null)
    setReason('')
    send.reset()
    setParams({})
  }

  const notFound = search.error instanceof ApiError && search.error.status === 404

  return (
    <>
      <PageHeader title={t('doctor.find.title')} description={t('doctor.find.subtitle')} />
      <Stepper step={request ? 1 : 0} />

      <Card padding="lg" className="mx-auto max-w-2xl">
        {request && patient ? (
          <CodeStep
            key={request.requestId}
            request={request}
            patient={patient}
            onVerified={onVerified}
            onResend={() => send.mutate()}
            resending={send.isPending}
            resendError={send.error}
          />
        ) : (
          <div className="space-y-6">
            <PatientSearchForm
              key={q}
              initial={q}
              autoFocus={!q}
              busy={search.isFetching}
              onSearch={(value) => {
                send.reset()
                setReason('')
                setParams({ q: value })
              }}
            />

            {query && search.isPending && <LoadingBlock lines={3} />}
            {notFound && (
              <p role="alert" className="rounded-xl bg-surface-soft px-4 py-3 text-sm font-semibold text-slate">
                {t('clinical.search.notFound')}
              </p>
            )}
            {search.isError && !notFound && <ErrorState error={search.error} onRetry={() => void search.refetch()} />}

            {patient && (
              <section aria-label={patient.fullName} className="space-y-5 rounded-2xl border border-line p-5">
                <PatientCard patient={patient} />
                {patient.hasActiveConsent ? (
                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-emerald-50 px-4 py-3">
                    <span className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-700">
                      <ShieldCheck aria-hidden className="h-4 w-4" />
                      {t('doctor.find.hasAccess')}
                    </span>
                    <Link
                      to={`/doctor/patients/${patient.patientId}`}
                      className="rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                    >
                      {t('doctor.find.openChart')}
                    </Link>
                  </div>
                ) : (
                  <form
                    noValidate
                    onSubmit={(e) => {
                      e.preventDefault()
                      send.mutate()
                    }}
                    className="space-y-4"
                  >
                    <Textarea
                      label={t('doctor.find.reasonLabel')}
                      placeholder={t('doctor.find.reasonPlaceholder')}
                      value={reason}
                      onChange={(e) => setReason(e.target.value.slice(0, 200))}
                      rows={2}
                      name="reason"
                    />
                    {send.isError && <FormError error={send.error} />}
                    <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                      <Button variant="ghost" onClick={startOver}>
                        {t('doctor.find.newSearch')}
                      </Button>
                      <Button type="submit" disabled={send.isPending}>
                        {send.isPending ? t('doctor.find.sending') : t('doctor.find.sendCode')}
                      </Button>
                    </div>
                  </form>
                )}
              </section>
            )}
          </div>
        )}
      </Card>
    </>
  )
}
