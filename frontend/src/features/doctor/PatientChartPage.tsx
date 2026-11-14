import { useEffect, useRef, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Clock, ShieldOff, TriangleAlert, WifiOff } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { ErrorState, LoadingBlock } from '@/components/ui/Feedback'
import { Tabs } from '@/components/ui/Tabs'
import { minutesLeft } from '@/features/patient/text'
import { useLanguage } from '@/i18n/useLanguage'
import { ApiError } from '@/lib/api'
import { formatNumber, initials } from '@/lib/format'
import { useNow } from '@/lib/useNow'
import { doctorApi, doctorKeys } from './api'
import { ChartLabs } from './ChartLabs'
import { ChartRecords } from './ChartRecords'
import { AiOverviewCard } from './AiOverviewCard'
import { ageFrom } from './helpers'
import { NewVisitForm } from './NewVisitForm'
import type { ClinicalProfile } from './types'

type Tab = 'records' | 'labs' | 'visit'
const TABS: Tab[] = ['records', 'labs', 'visit']
const POLL_MS = 30_000

const isConsentLost = (error: unknown) => error instanceof ApiError && error.code === 'CONSENT_REQUIRED'

const backLink = (label: string) => (
  <Link to="/doctor/patients" className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-brand hover:underline">
    <ArrowLeft aria-hidden className="h-4 w-4" />
    {label}
  </Link>
)

function AccessEnded({ uhid }: { uhid?: string }) {
  const { t } = useTranslation()
  return (
    <Card padding="lg" className="mx-auto max-w-lg text-center">
      <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate">
        <ShieldOff aria-hidden className="h-7 w-7" />
      </span>
      <h1 className="text-xl font-black text-ink">{t('doctor.chart.endedTitle')}</h1>
      <p className="mt-2 text-sm text-slate">{t('doctor.chart.endedBody')}</p>
      <Link
        to={uhid ? `/doctor/find?q=${encodeURIComponent(uhid)}` : '/doctor/find'}
        className="mt-6 inline-flex rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white shadow-brand hover:bg-brand-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
      >
        {t('doctor.chart.requestAgain')}
      </Link>
    </Card>
  )
}

function ChartHeader({ profile, minutes }: { profile: ClinicalProfile; minutes: number }) {
  const { t } = useTranslation()
  const lang = useLanguage()
  const age = ageFrom(profile.dateOfBirth)
  const gender =
    profile.gender === 'male' || profile.gender === 'female' || profile.gender === 'other'
      ? t(`clinical.${profile.gender}`)
      : null
  const facts = [
    age !== null ? t('doctor.chart.age', { age: formatNumber(age, lang) }) : null,
    gender,
  ].filter(Boolean)

  return (
    <Card className="mb-6">
      <div className="flex flex-wrap items-start gap-4">
        <span
          aria-hidden
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand to-teal text-lg font-bold text-white"
        >
          {initials(profile.fullName)}
        </span>
        <div className="min-w-0 flex-1">
          <h1 className="break-words text-[clamp(1.3rem,2.4vw,1.7rem)] font-black leading-tight tracking-tight text-ink">
            {profile.fullName}
          </h1>
          {/* Each fact stays on one line; the row wraps between facts, never inside one. */}
          <p className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-sm text-slate">
            <span className="whitespace-nowrap font-mono">{profile.uhid}</span>
            {facts.map((f) => (
              <span key={f} className="whitespace-nowrap">
                {f}
              </span>
            ))}
            <span className="whitespace-nowrap">
              {t('doctor.chart.bloodGroup')}: <strong className="text-ink">{profile.bloodGroup ?? t('doctor.chart.unknown')}</strong>
            </span>
          </p>
        </div>
        {/* On phones the timer drops to its own row so the name keeps the full width. */}
        <div className="w-full sm:w-auto">
          <Badge tone={minutes <= 5 ? 'warning' : 'success'}>
            <Clock aria-hidden className="h-3 w-3" />
            {minutes <= 1 ? t('doctor.chart.accessEnding') : t('doctor.chart.accessLeft', { minutes: formatNumber(minutes, lang) })}
          </Badge>
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2">
        {/* Allergies first and loudest: this is what must not be missed when prescribing. */}
        <div
          className={`rounded-xl px-4 py-3 ${
            profile.allergies.length ? 'border border-red-200 bg-red-50' : 'border border-line bg-surface-soft'
          }`}
        >
          <p className={`mb-1.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide ${profile.allergies.length ? 'text-red-700' : 'text-slate'}`}>
            {profile.allergies.length > 0 && <TriangleAlert aria-hidden className="h-3.5 w-3.5" />}
            {t('doctor.chart.allergies')}
          </p>
          {profile.allergies.length ? (
            <div className="flex flex-wrap gap-1.5">
              {profile.allergies.map((a) => (
                <Badge key={a} tone="danger">
                  {a}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate">{t('doctor.chart.noAllergies')}</p>
          )}
        </div>
        <div className="rounded-xl border border-line bg-surface-soft px-4 py-3">
          <p className="mb-1.5 text-xs font-bold uppercase tracking-wide text-slate">{t('doctor.chart.chronic')}</p>
          {profile.chronicDiseases.length ? (
            <div className="flex flex-wrap gap-1.5">
              {profile.chronicDiseases.map((c) => (
                <Badge key={c} tone="brand">
                  {c}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate">{t('doctor.chart.noChronic')}</p>
          )}
        </div>
      </div>
    </Card>
  )
}

/** One patient's chart while consent lasts; it locks itself the moment access ends. */
export function PatientChartPage() {
  const { t } = useTranslation()
  const { patientId = '' } = useParams()
  const [params, setParams] = useSearchParams()
  const queryClient = useQueryClient()
  const now = useNow(15_000)
  const tab: Tab = TABS.includes(params.get('tab') as Tab) ? (params.get('tab') as Tab) : 'records'
  // The visit form mounts on first use and then stays mounted (hidden on other tabs), so
  // glancing at the records never throws away a half-written visit.
  const [visitMounted, setVisitMounted] = useState(tab === 'visit')

  const profile = useQuery({
    queryKey: doctorKeys.profile(patientId),
    queryFn: () => doctorApi.profile(patientId),
    select: (res) => res.data,
    enabled: patientId !== '',
    // Notices a revoke by the patient even when the doctor isn't clicking anything.
    refetchInterval: (query) => (isConsentLost(query.state.error) ? false : POLL_MS),
  })

  const minutes = profile.data ? minutesLeft(profile.data.consentExpiresAt, now) : 0
  const ended = isConsentLost(profile.error) || (profile.data !== undefined && minutes === 0)

  // When access ends, drop everything cached for this patient. The profile itself is kept
  // while this screen shows (it names the patient for "request again") and dropped on leave.
  const endedRef = useRef(ended)
  useEffect(() => {
    endedRef.current = ended
    if (ended) {
      queryClient.removeQueries({ queryKey: doctorKeys.patient(patientId), predicate: (q) => q.queryKey[3] !== 'profile' })
      void queryClient.invalidateQueries({ queryKey: doctorKeys.patients() })
    }
  }, [ended, patientId, queryClient])
  useEffect(
    () => () => {
      if (endedRef.current) queryClient.removeQueries({ queryKey: doctorKeys.profile(patientId) })
    },
    [patientId, queryClient],
  )

  if (profile.isPending) {
    return (
      <>
        {backLink(t('doctor.chart.back'))}
        <Card>
          <LoadingBlock lines={5} />
        </Card>
      </>
    )
  }
  if (ended) {
    return (
      <>
        {backLink(t('doctor.chart.back'))}
        <AccessEnded uhid={profile.data?.uhid} />
      </>
    )
  }
  if (!profile.data) {
    return (
      <>
        {backLink(t('doctor.chart.back'))}
        <Card>
          <ErrorState error={profile.error} onRetry={() => void profile.refetch()} />
        </Card>
      </>
    )
  }

  return (
    <>
      {backLink(t('doctor.chart.back'))}
      {/* A failed background refresh keeps the last chart (and any draft) on screen. */}
      {profile.isError && (
        <p role="status" className="mb-4 flex items-center gap-2 rounded-xl bg-amber-50 px-4 py-2.5 text-sm font-semibold text-amber-800">
          <WifiOff aria-hidden className="h-4 w-4 shrink-0" />
          {t('doctor.chart.reconnecting')}
        </p>
      )}
      <ChartHeader profile={profile.data} minutes={minutes} />
      <AiOverviewCard patientId={patientId} />
      <Tabs
        label={t('doctor.chart.tabsLabel')}
        value={tab}
        onChange={(next) => {
          if (next === 'visit') setVisitMounted(true)
          setParams(next === 'records' ? {} : { tab: next }, { replace: true })
        }}
        tabs={[
          { id: 'records', label: t('doctor.chart.tabRecords') },
          { id: 'labs', label: t('doctor.chart.tabLabs') },
          { id: 'visit', label: t('doctor.chart.tabNewVisit') },
        ]}
      >
        {tab === 'records' && <ChartRecords patientId={patientId} />}
        {tab === 'labs' && <ChartLabs patientId={patientId} />}
        {(visitMounted || tab === 'visit') && (
          <div hidden={tab !== 'visit'}>
            <NewVisitForm profile={profile.data} />
          </div>
        )}
      </Tabs>
    </>
  )
}
