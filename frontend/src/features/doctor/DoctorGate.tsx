import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Outlet } from 'react-router-dom'
import { BadgeCheck, Clock, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { authApi, meQueryKey } from '@/features/auth/api'
import { useAuthStore } from '@/stores/auth'

/** While pending, look for the admin's approval every 30 s so the page unlocks itself. */
const RECHECK_MS = 30_000

function PendingVerification({ bmdc, onCheck, checking }: { bmdc?: string; onCheck: () => void; checking: boolean }) {
  const { t } = useTranslation()
  return (
    <div className="mx-auto max-w-xl py-6">
      <Card padding="lg" className="text-center">
        <span className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
          <Clock aria-hidden className="h-8 w-8" />
        </span>
        <h1 className="text-2xl font-black tracking-tight text-ink">{t('doctor.pending.title')}</h1>
        <p className="mt-2 text-sm text-slate">{t('doctor.pending.body')}</p>
        {bmdc && (
          <p className="mx-auto mt-5 inline-flex items-center gap-2 rounded-xl bg-surface-soft px-4 py-2 text-sm">
            <BadgeCheck aria-hidden className="h-4 w-4 text-brand" />
            <span className="text-slate">{t('doctor.pending.bmdc')}:</span>
            <span className="font-mono font-bold text-ink">{bmdc}</span>
          </p>
        )}
        <div className="mt-6 rounded-xl border border-line p-4 text-left">
          <p className="text-sm font-bold text-ink">{t('doctor.pending.next')}</p>
          <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-body">
            <li>{t('doctor.pending.step1')}</li>
            <li>{t('doctor.pending.step2')}</li>
          </ol>
        </div>
        <Button variant="outline" className="mt-6" onClick={onCheck} disabled={checking}>
          <RefreshCw aria-hidden className={`h-4 w-4 ${checking ? 'animate-spin' : ''}`} />
          {t('doctor.pending.check')}
        </Button>
      </Card>
    </div>
  )
}

/**
 * Every doctor page sits behind this: an unverified doctor sees a clear "being
 * verified" screen instead of pages that would only return "pending" errors.
 */
export function DoctorGate() {
  const user = useAuthStore((s) => s.user)
  const setUser = useAuthStore((s) => s.setUser)
  const pending = user?.status !== 'active'

  const me = useQuery({
    queryKey: meQueryKey,
    queryFn: () => authApi.me(),
    select: (res) => res.data,
    enabled: pending,
    refetchInterval: pending ? RECHECK_MS : false,
  })

  useEffect(() => {
    if (me.data) setUser(me.data)
  }, [me.data, setUser])

  if (!pending) return <Outlet />
  return (
    <PendingVerification
      bmdc={user?.doctor?.bmdcNumber}
      onCheck={() => void me.refetch()}
      checking={me.isFetching}
    />
  )
}
