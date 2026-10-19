import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Clock } from 'lucide-react'
import { authApi } from '@/features/auth/api'
import { PageHeader } from '@/components/layout/dashboard/PageHeader'
import { Badge, type BadgeTone } from '@/components/ui/Badge'
import { Card, CardHeader } from '@/components/ui/Card'
import { ErrorState, LoadingBlock } from '@/components/ui/Feedback'
import { useAuthStore } from '@/stores/auth'
import type { AuthUser, UserStatus } from '@/types/api'
import { displayName } from './displayName'

export const meQueryKey = ['auth', 'me'] as const

const STATUS_TONE: Record<UserStatus, BadgeTone> = {
  active: 'success',
  pending: 'warning',
  suspended: 'danger',
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
      <dt className="text-sm text-slate">{label}</dt>
      <dd className="break-all text-sm font-semibold text-ink sm:text-right">{children}</dd>
    </div>
  )
}

function UhidCard({ uhid, holder, bloodGroup }: { uhid: string; holder: string; bloodGroup?: string | null }) {
  const { t } = useTranslation()
  return (
    <div className="relative flex min-h-[220px] flex-col justify-between overflow-hidden rounded-2xl bg-gradient-to-br from-brand to-[#0a4f99] p-6 text-white shadow-[0_18px_48px_rgba(11,92,173,0.3)]">
      <svg aria-hidden className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.08]">
        <defs>
          <pattern id="uhidmesh" width="36" height="36" patternUnits="userSpaceOnUse">
            <path d="M36 0H0v36" fill="none" stroke="#fff" strokeWidth="0.8" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#uhidmesh)" />
      </svg>
      <div className="relative">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-white/70">
          {t('dashboard.overview.uhid')}
        </p>
        <p className="mt-2 font-mono text-2xl font-bold tracking-wide sm:text-[1.7rem]">{uhid}</p>
      </div>
      <div className="relative mt-8 flex items-end justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-widest text-white/60">{t('dashboard.overview.holder')}</p>
          <p className="truncate text-sm font-semibold" title={holder}>
            {holder}
          </p>
        </div>
        {bloodGroup && (
          <div className="shrink-0 text-right">
            <p className="text-[10px] uppercase tracking-widest text-white/60">{t('dashboard.overview.bloodGroup')}</p>
            <p className="text-sm font-bold">{bloodGroup}</p>
          </div>
        )}
      </div>
    </div>
  )
}

function Overview({ user }: { user: AuthUser }) {
  const { t } = useTranslation()
  const pendingMessage =
    user.status === 'pending' && (user.role === 'doctor' || user.role === 'lab')
      ? t(`dashboard.pending.${user.role}`)
      : null

  return (
    <div className="space-y-6">
      {pendingMessage && (
        <div role="status" className="flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-800">
          <Clock aria-hidden className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
          <p>{pendingMessage}</p>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        {user.patient?.uhid && (
          <UhidCard uhid={user.patient.uhid} holder={user.patient.fullName} bloodGroup={user.patient.bloodGroup} />
        )}

        <Card as="section" aria-labelledby="account-heading" className={user.patient?.uhid ? '' : 'lg:col-span-2'}>
          <CardHeader id="account-heading" title={t('dashboard.overview.profileTitle')} />
          <dl className="divide-y divide-line">
            <Row label={t('dashboard.overview.email')}>{user.email}</Row>
            <Row label={t('dashboard.overview.phone')}>{user.phone}</Row>
            <Row label={t('dashboard.overview.role')}>{t(`roles.${user.role}`)}</Row>
            <Row label={t('dashboard.overview.status')}>
              <Badge tone={STATUS_TONE[user.status]}>{t(`status.${user.status}`)}</Badge>
            </Row>
          </dl>
        </Card>
      </div>
    </div>
  )
}

/**
 * Phase-0 home for every role: the live account from /auth/me. Refreshing it also
 * updates the stored user, so e.g. an approval made by an admin shows up here.
 */
export function AccountOverview() {
  const { t } = useTranslation()
  const storedUser = useAuthStore((s) => s.user)
  const setUser = useAuthStore((s) => s.setUser)
  const me = useQuery({ queryKey: meQueryKey, queryFn: async () => (await authApi.me()).data })

  useEffect(() => {
    if (me.data) setUser(me.data)
  }, [me.data, setUser])

  const user = me.data ?? storedUser
  const name = user ? displayName(user) : ''

  return (
    <>
      <PageHeader
        title={t('dashboard.overview.welcome', { name })}
        description={t('dashboard.overview.subtitle')}
      />
      {me.isPending && !user ? (
        <Card>
          <LoadingBlock />
        </Card>
      ) : me.isError && !me.data ? (
        <Card>
          <ErrorState error={me.error} onRetry={() => void me.refetch()} />
        </Card>
      ) : user ? (
        <Overview user={user} />
      ) : null}
    </>
  )
}
