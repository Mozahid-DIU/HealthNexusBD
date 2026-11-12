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

export interface ApprovalCopy {
  /** What the admin is checking and what unlocks afterwards. */
  body: string
  /** e.g. "BMDC registration" / "DGHS licence". */
  idLabel: string
  idValue?: string
  /** The first "what happens next" step (the second, auto-unlock, is shared). */
  firstStep: string
}

function PendingVerification({ copy, onCheck, checking }: { copy: ApprovalCopy; onCheck: () => void; checking: boolean }) {
  const { t } = useTranslation()
  return (
    <div className="mx-auto max-w-xl py-6">
      <Card padding="lg" className="text-center">
        <span className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
          <Clock aria-hidden className="h-8 w-8" />
        </span>
        <h1 className="text-2xl font-black tracking-tight text-ink">{t('verification.title')}</h1>
        <p className="mt-2 text-sm text-slate">{copy.body}</p>
        {copy.idValue && (
          <p className="mx-auto mt-5 inline-flex items-center gap-2 rounded-xl bg-surface-soft px-4 py-2 text-sm">
            <BadgeCheck aria-hidden className="h-4 w-4 text-brand" />
            <span className="text-slate">{copy.idLabel}:</span>
            <span className="font-mono font-bold text-ink">{copy.idValue}</span>
          </p>
        )}
        <div className="mt-6 rounded-xl border border-line p-4 text-left">
          <p className="text-sm font-bold text-ink">{t('verification.next')}</p>
          <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-body">
            <li>{copy.firstStep}</li>
            <li>{t('verification.autoUnlock')}</li>
          </ol>
        </div>
        <Button variant="outline" className="mt-6" onClick={onCheck} disabled={checking}>
          <RefreshCw aria-hidden className={`h-4 w-4 ${checking ? 'animate-spin' : ''}`} />
          {t('verification.check')}
        </Button>
      </Card>
    </div>
  )
}

/**
 * Wraps the pages of a role that needs admin approval (doctor, lab): until approved,
 * the user sees a clear "being verified" screen instead of pages that would only
 * return "pending" errors, and it unlocks by itself once the admin approves.
 */
export function ApprovalGate({ copy }: { copy: ApprovalCopy }) {
  const status = useAuthStore((s) => s.user?.status)
  const setUser = useAuthStore((s) => s.setUser)
  const pending = status !== 'active'

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
  return <PendingVerification copy={copy} onCheck={() => void me.refetch()} checking={me.isFetching} />
}
