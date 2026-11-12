import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { ChevronRight, Eye, FilePlus2, KeyRound, LogIn, ShieldCheck, ShieldX, type LucideIcon } from 'lucide-react'
import { Card, CardHeader } from '@/components/ui/Card'
import { ErrorState, LoadingBlock } from '@/components/ui/Feedback'
import { useLanguage } from '@/i18n/useLanguage'
import { formatDateTime, formatRelative } from '@/lib/format'
import { adminApi, adminKeys } from '../api'
import { describeAudit } from '../auditText'
import type { AuditRow } from '../types'

const FEED_SIZE = 6
/** What people did, not when they signed in (sign-ins are in the full log). */
const FEED = { page: 1, limit: FEED_SIZE, exclude: 'login' } as const

const ICONS: Record<AuditRow['action'], { icon: LucideIcon; tint: string }> = {
  view: { icon: Eye, tint: 'bg-brand/[0.08] text-brand' },
  create: { icon: FilePlus2, tint: 'bg-teal/10 text-teal' },
  update: { icon: ShieldCheck, tint: 'bg-violet-50 text-violet-600' },
  grant: { icon: KeyRound, tint: 'bg-emerald-50 text-emerald-600' },
  revoke: { icon: ShieldX, tint: 'bg-amber-50 text-amber-700' },
  login: { icon: LogIn, tint: 'bg-slate-100 text-slate-600' },
}

/** The latest audit entries as a readable feed; the full log is one click away. */
export function RecentActivity() {
  const { t } = useTranslation()
  const lang = useLanguage()
  const feed = useQuery({
    queryKey: adminKeys.audit(FEED),
    queryFn: () => adminApi.audit(FEED),
    refetchInterval: 60_000,
  })

  return (
    <Card as="section" aria-labelledby="recent-activity" className="flex min-w-0 flex-col">
      <CardHeader
        id="recent-activity"
        title={t('admin.activity.title')}
        action={
          <Link to="/admin/audit" className="inline-flex items-center gap-1 text-sm font-semibold text-brand hover:underline">
            {t('admin.activity.viewAll')}
            <ChevronRight aria-hidden className="h-4 w-4" />
          </Link>
        }
      />
      {feed.isPending ? (
        <LoadingBlock lines={5} />
      ) : feed.isError ? (
        <ErrorState error={feed.error} onRetry={() => void feed.refetch()} />
      ) : feed.data.data.length === 0 ? (
        <p className="text-sm text-slate">{t('admin.activity.empty')}</p>
      ) : (
        <ol className="relative space-y-4 before:absolute before:bottom-2 before:left-[15px] before:top-2 before:w-px before:bg-line">
          {feed.data.data.map((row) => {
            const { icon: Icon, tint } = ICONS[row.action]
            const { text } = describeAudit(row, t)
            return (
              <li key={row.id} className="relative flex gap-3">
                <span className={`relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full ring-4 ring-white ${tint}`}>
                  <Icon aria-hidden className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-ink">{text}</p>
                  <p className="truncate text-xs text-slate">
                    {row.actor.email} · {t(`roles.${row.actor.role}`)}
                    {row.patient && ` → ${row.patient.fullName}`}
                  </p>
                </div>
                <time dateTime={row.createdAt} title={formatDateTime(row.createdAt, lang)} className="shrink-0 text-xs text-faint">
                  {formatRelative(row.createdAt, lang)}
                </time>
              </li>
            )
          })}
        </ol>
      )}
    </Card>
  )
}
