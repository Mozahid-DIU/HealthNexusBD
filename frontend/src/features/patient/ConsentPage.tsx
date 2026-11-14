import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Clock, Info, ShieldCheck, ShieldQuestion, UserRound } from 'lucide-react'
import { PageHeader } from '@/components/layout/dashboard/PageHeader'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader } from '@/components/ui/Card'
import { EmptyState, ErrorState, LoadingBlock } from '@/components/ui/Feedback'
import { ConfirmDialog } from '@/components/ui/Modal'
import { useLanguage } from '@/i18n/useLanguage'
import { formatDateTime, formatNumber } from '@/lib/format'
import { translateApiError } from '@/lib/errors'
import { useNow } from '@/lib/useNow'
import { toast } from '@/stores/toast'
import { patientApi, patientKeys } from './api'
import { minutesLeft } from './text'
import type { ActiveSession, ConsentDoctor, PendingRequest } from './types'

/** New requests and expiring sessions should show up without a manual refresh. */
const POLL_MS = 20_000

function DoctorLine({ doctor }: { doctor: ConsentDoctor }) {
  const { t } = useTranslation()
  return (
    <div className="flex min-w-0 items-center gap-3">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand/8 text-brand">
        <UserRound aria-hidden className="h-5 w-5" />
      </span>
      <div className="min-w-0">
        <p className="truncate text-[15px] font-bold text-ink">{doctor.fullName}</p>
        <p className="truncate text-xs text-slate">
          {[doctor.specialization, t('patient.consent.bmdc', { number: doctor.bmdcNumber })].filter(Boolean).join(' · ')}
        </p>
      </div>
    </div>
  )
}

type Pending = { kind: 'deny'; item: PendingRequest } | { kind: 'revoke'; item: ActiveSession } | null

export function ConsentPage() {
  const { t } = useTranslation()
  const lang = useLanguage()
  const now = useNow(15_000)
  const queryClient = useQueryClient()
  const [confirming, setConfirming] = useState<Pending>(null)

  const activity = useQuery({
    queryKey: patientKeys.consent(),
    queryFn: () => patientApi.consent(),
    select: (res) => res.data,
    refetchInterval: POLL_MS,
  })

  const action = useMutation({
    mutationFn: async (target: NonNullable<Pending>): Promise<void> => {
      if (target.kind === 'deny') await patientApi.denyRequest(target.item.requestId)
      else await patientApi.revokeSession(target.item.sessionId)
    },
    onSuccess: (_res, target) => {
      toast.success(target.kind === 'deny' ? t('patient.consent.denied') : t('patient.consent.revoked'))
    },
    onError: (error) => toast.error(translateApiError(error, t)),
    // Either way the list may have changed (e.g. the request already expired). Close the
    // dialog only once it is reloaded, so the handled row can't be acted on twice.
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: patientKeys.consent() })
      setConfirming(null)
    },
  })

  const pending = activity.data?.pendingRequests ?? []
  // The server only returns sessions that are still live; filtering again with this
  // device's clock would hide (and block revoking) live sessions on a fast clock.
  const active = activity.data?.activeSessions ?? []

  return (
    <>
      <PageHeader title={t('patient.consent.title')} description={t('patient.consent.subtitle')} />

      <div className="mb-6 flex gap-3 rounded-2xl border border-brand/15 bg-brand/4 px-5 py-4 text-sm text-body">
        <Info aria-hidden className="mt-0.5 h-5 w-5 shrink-0 text-brand" />
        <p>{t('patient.consent.howItWorks')}</p>
      </div>

      {activity.isPending ? (
        <Card>
          <LoadingBlock lines={5} />
        </Card>
      ) : activity.isError ? (
        <Card>
          <ErrorState error={activity.error} onRetry={() => void activity.refetch()} />
        </Card>
      ) : (
        <div className="grid gap-6 xl:grid-cols-2">
          <Card as="section" aria-labelledby="pending-heading">
            <CardHeader
              id="pending-heading"
              title={
                <span className="inline-flex items-center gap-2">
                  {t('patient.consent.pendingTitle')}
                  {pending.length > 0 && <Badge tone="warning">{formatNumber(pending.length, lang)}</Badge>}
                </span>
              }
            />
            {pending.length === 0 ? (
              <EmptyState icon={<ShieldQuestion aria-hidden className="h-6 w-6" />} title={t('patient.consent.pendingEmpty')} />
            ) : (
              <ul className="space-y-3">
                {pending.map((req) => (
                  <li key={req.requestId} className="rounded-xl border border-amber-200 bg-amber-50/50 p-4">
                    <DoctorLine doctor={req.doctor} />
                    <dl className="mt-3 space-y-1 text-sm">
                      <div className="flex gap-2">
                        <dt className="font-semibold text-slate">{t('patient.consent.reason')}:</dt>
                        <dd className="text-body">{req.reason || t('patient.consent.noReason')}</dd>
                      </div>
                    </dl>
                    <p className="mt-2 text-xs text-slate">
                      {t('patient.consent.requested', { time: formatDateTime(req.requestedAt, lang) })} ·{' '}
                      {t('patient.consent.codeExpires', { time: formatDateTime(req.expiresAt, lang) })}
                    </p>
                    <div className="mt-3 flex justify-end">
                      <Button
                        size="sm"
                        variant="outline"
                        aria-label={`${t('patient.consent.deny')}: ${req.doctor.fullName}`}
                        onClick={() => setConfirming({ kind: 'deny', item: req })}
                      >
                        {t('patient.consent.deny')}
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card as="section" aria-labelledby="active-heading">
            <CardHeader id="active-heading" title={t('patient.consent.activeTitle')} />
            {active.length === 0 ? (
              <EmptyState icon={<ShieldCheck aria-hidden className="h-6 w-6" />} title={t('patient.consent.activeEmpty')} />
            ) : (
              <ul className="space-y-3">
                {active.map((session) => {
                  const minutes = minutesLeft(session.expiresAt, now)
                  return (
                    <li key={session.sessionId} className="rounded-xl border border-line p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <DoctorLine doctor={session.doctor} />
                        <Badge tone={minutes <= 5 ? 'warning' : 'success'}>
                          <Clock aria-hidden className="h-3 w-3" />
                          {minutes <= 1
                            ? t('patient.consent.ending')
                            : t('patient.consent.minutesLeft', { minutes: formatNumber(minutes, lang) })}
                        </Badge>
                      </div>
                      <p className="mt-2 text-xs text-slate">
                        {t('patient.consent.granted', { time: formatDateTime(session.grantedAt, lang) })}
                      </p>
                      <div className="mt-3 flex justify-end">
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-red-300! text-red-600! hover:bg-red-50!"
                          aria-label={`${t('patient.consent.revoke')}: ${session.doctor.fullName}`}
                          onClick={() => setConfirming({ kind: 'revoke', item: session })}
                        >
                          {t('patient.consent.revoke')}
                        </Button>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </Card>
        </div>
      )}

      <ConfirmDialog
        open={confirming !== null}
        tone="danger"
        busy={action.isPending}
        title={confirming?.kind === 'deny' ? t('patient.consent.denyTitle') : t('patient.consent.revokeTitle')}
        description={
          confirming
            ? confirming.kind === 'deny'
              ? t('patient.consent.denyBody', { doctor: confirming.item.doctor.fullName })
              : t('patient.consent.revokeBody', { doctor: confirming.item.doctor.fullName })
            : undefined
        }
        confirmLabel={confirming?.kind === 'deny' ? t('patient.consent.deny') : t('patient.consent.revoke')}
        onCancel={() => setConfirming(null)}
        onConfirm={() => confirming && action.mutate(confirming)}
      />
    </>
  )
}
