import { useTranslation } from 'react-i18next'
import { BadgeCheck, CircleAlert, CircleHelp, Mail, Phone } from 'lucide-react'
import { Badge, type BadgeTone } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { useLanguage } from '@/i18n/useLanguage'
import { formatDate, initials } from '@/lib/format'
import type { AccountStatus, AccountSummary } from '../types'
import { namesMatch } from '../verification'

/** A doctor or lab application in one shape, so both queues share one card. */
export interface Application {
  id: string
  kind: 'doctor' | 'lab'
  name: string
  idLabel: string
  idValue: string
  detailLabel: string
  detail: string | null
  account: AccountSummary
  registryLabel: string
  registry: { name: string; detail: string | null } | null
}

const STATUS_TONE: Record<AccountStatus, BadgeTone> = { pending: 'warning', active: 'success', suspended: 'danger' }

function RegistryCheck({ app }: { app: Application }) {
  const { t } = useTranslation()
  if (!app.registry) {
    return (
      <p className="flex items-center gap-1.5 text-sm font-semibold text-red-700">
        <CircleHelp aria-hidden className="h-4 w-4 shrink-0" />
        {t('admin.verify.missing')}
      </p>
    )
  }
  const same = namesMatch(app.name, app.registry.name)
  return (
    <div>
      <p className="font-semibold text-ink">{app.registry.name}</p>
      {app.registry.detail && <p className="text-sm text-slate">{app.registry.detail}</p>}
      <p className={`mt-1.5 flex items-start gap-1.5 text-xs font-semibold ${same ? 'text-emerald-700' : 'text-amber-700'}`}>
        {same ? <BadgeCheck aria-hidden className="h-4 w-4 shrink-0" /> : <CircleAlert aria-hidden className="h-4 w-4 shrink-0" />}
        {same ? t('admin.verify.matches') : t('admin.verify.differs')}
      </p>
    </div>
  )
}

interface ApplicationCardProps {
  app: Application
  onApprove: () => void
  onReject: () => void
}

/**
 * What the applicant submitted, side by side with the official registry's record, and
 * the decision buttons. Approve shows for anyone not active (including a rejected
 * account being reconsidered); Reject only while the account is still waiting.
 */
export function ApplicationCard({ app, onApprove, onReject }: ApplicationCardProps) {
  const { t } = useTranslation()
  const lang = useLanguage()
  const status = app.account.status
  return (
    <li className="rounded-2xl border border-line bg-white p-5 shadow-card transition hover:shadow-soft">
      <div className="flex flex-wrap items-start gap-4">
        <span
          aria-hidden
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand to-teal text-base font-bold text-white"
        >
          {initials(app.name)}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="break-words text-lg font-black text-ink">{app.name}</h3>
            <Badge tone={STATUS_TONE[status]}>{t(`status.${status}`)}</Badge>
          </div>
          <p className="mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5 text-sm text-slate">
            <span className="whitespace-nowrap">
              {app.idLabel}: <span className="font-mono font-semibold text-ink">{app.idValue}</span>
            </span>
            <span className="whitespace-nowrap">{t('admin.verify.registered', { date: formatDate(app.account.createdAt, lang) })}</span>
          </p>
          <p className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-sm text-body">
            <span className="inline-flex min-w-0 items-center gap-1.5">
              <Mail aria-hidden className="h-3.5 w-3.5 shrink-0 text-faint" />
              <span className="truncate">{app.account.email}</span>
            </span>
            <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
              <Phone aria-hidden className="h-3.5 w-3.5 text-faint" />
              {app.account.phone}
            </span>
          </p>
        </div>
      </div>

      <dl className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl bg-surface-soft px-4 py-3">
          <dt className="mb-1 text-xs font-bold uppercase tracking-wide text-slate">{t('admin.verify.submitted')}</dt>
          <dd>
            <p className="font-semibold text-ink">{app.name}</p>
            <p className="text-sm text-slate">
              {app.detailLabel}: {app.detail ?? '—'}
            </p>
          </dd>
        </div>
        <div className="rounded-xl border border-line px-4 py-3">
          <dt className="mb-1 text-xs font-bold uppercase tracking-wide text-slate">{app.registryLabel}</dt>
          <dd>
            <RegistryCheck app={app} />
          </dd>
        </div>
      </dl>

      {status !== 'active' && (
        <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          {status === 'pending' && (
            <Button
              variant="outline"
              onClick={onReject}
              aria-label={t('admin.verify.actionsFor', { action: t('admin.verify.reject'), name: app.name })}
              className="!border-red-200 !text-red-700 hover:!bg-red-50"
            >
              {t('admin.verify.reject')}
            </Button>
          )}
          <Button onClick={onApprove} aria-label={t('admin.verify.actionsFor', { action: t('admin.verify.approve'), name: app.name })}>
            <BadgeCheck aria-hidden className="h-4 w-4" />
            {t('admin.verify.approve')}
          </Button>
        </div>
      )}
    </li>
  )
}
