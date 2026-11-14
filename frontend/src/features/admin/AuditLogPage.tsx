import { useCallback } from 'react'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router-dom'
import { ScrollText } from 'lucide-react'
import { PageHeader } from '@/components/layout/dashboard/PageHeader'
import { Badge, type BadgeTone } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { EmptyState, ErrorState, LoadingBlock } from '@/components/ui/Feedback'
import { Pagination } from '@/components/ui/Pagination'
import { useLanguage } from '@/i18n/useLanguage'
import { formatDateTime, formatRelative } from '@/lib/format'
import { useClampPage, usePageParam } from '@/lib/usePageParam'
import { adminApi, adminKeys, type AuditFilters } from './api'
import { describeAudit } from './auditText'
import { FilterSelect, SearchField } from './filters'
import type { AuditAction, AuditRow } from './types'

const ACTIONS: AuditAction[] = ['view', 'create', 'update', 'grant', 'revoke', 'login']
const ACTION_TONE: Record<AuditAction, BadgeTone> = {
  view: 'brand',
  create: 'teal',
  update: 'neutral',
  grant: 'success',
  revoke: 'warning',
  login: 'neutral',
}

function When({ at }: { at: string }) {
  const lang = useLanguage()
  return (
    <time dateTime={at} title={formatDateTime(at, lang)}>
      <span className="block font-medium text-ink">{formatRelative(at, lang)}</span>
      <span className="block text-xs text-slate">{formatDateTime(at, lang)}</span>
    </time>
  )
}

function What({ row }: { row: AuditRow }) {
  const { t } = useTranslation()
  const { text, reason } = describeAudit(row, t)
  return (
    <div>
      <p className="font-semibold text-ink">{text}</p>
      {reason && <p className="text-xs text-slate">{t('admin.audit.reason', { reason })}</p>}
    </div>
  )
}

/** The platform-wide, tamper-proof access log, searchable by person or patient. */
export function AuditLogPage() {
  const { t } = useTranslation()
  const [params, setParams] = useSearchParams()
  const [page, setPage] = usePageParam()
  const q = params.get('q') ?? ''
  const action = ACTIONS.includes(params.get('action') as AuditAction) ? (params.get('action') as AuditAction) : undefined
  const filters: AuditFilters = { q: q || undefined, action, page }

  const audit = useQuery({
    queryKey: adminKeys.audit(filters),
    queryFn: () => adminApi.audit(filters),
    placeholderData: keepPreviousData,
  })
  useClampPage(page, audit.data?.meta, setPage)

  const setFilter = useCallback(
    (key: 'q' | 'action', value: string) =>
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          next.delete('page')
          if (value) next.set(key, value)
          else next.delete(key)
          return next
        },
        { replace: true },
      ),
    [setParams],
  )
  const onSearch = useCallback((value: string) => setFilter('q', value), [setFilter])

  const rows = audit.data?.data ?? []

  return (
    <>
      <PageHeader title={t('admin.audit.title')} description={t('admin.audit.subtitle')} />
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center">
        <SearchField
          label={t('admin.audit.search')}
          placeholder={t('admin.audit.searchPlaceholder')}
          value={q}
          onChange={onSearch}
          clearLabel={t('admin.users.clearSearch')}
        />
        <FilterSelect
          label={t('admin.audit.what')}
          value={action ?? ''}
          onChange={(v) => setFilter('action', v)}
          options={[{ value: '', label: t('admin.audit.allActions') }, ...ACTIONS.map((a) => ({ value: a, label: t(`admin.audit.actions.${a}`) }))]}
        />
      </div>

      <Card>
        {audit.isPending ? (
          <LoadingBlock lines={8} />
        ) : audit.isError ? (
          <ErrorState error={audit.error} onRetry={() => void audit.refetch()} />
        ) : rows.length === 0 ? (
          <EmptyState icon={<ScrollText aria-hidden className="h-6 w-6" />} title={t('admin.audit.empty')} description={t('admin.audit.emptyBody')} />
        ) : (
          <div className={`transition-opacity ${audit.isPlaceholderData ? 'opacity-60' : ''}`}>
            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-line text-xs font-semibold uppercase tracking-wide text-slate">
                  <tr>
                    <th scope="col" className="py-3 pr-4">{t('admin.audit.when')}</th>
                    <th scope="col" className="px-4 py-3">{t('admin.audit.who')}</th>
                    <th scope="col" className="px-4 py-3">{t('admin.audit.what')}</th>
                    <th scope="col" className="px-4 py-3">{t('admin.audit.patient')}</th>
                    <th scope="col" className="py-3 pl-4">{t('admin.audit.ip')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line align-top">
                  {rows.map((row) => (
                    <tr key={row.id} className="transition hover:bg-surface-soft/70">
                      <td className="whitespace-nowrap py-3 pr-4">
                        <When at={row.createdAt} />
                      </td>
                      <td className="px-4 py-3">
                        <p className="max-w-60 truncate text-body">{row.actor.email}</p>
                        <p className="text-xs text-slate">{t(`roles.${row.actor.role}`)}</p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-start gap-2">
                          <Badge tone={ACTION_TONE[row.action]}>{t(`admin.audit.actions.${row.action}`)}</Badge>
                          <What row={row} />
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {row.patient ? (
                          <>
                            <p className="text-body">{row.patient.fullName}</p>
                            <p className="font-mono text-xs text-slate">{row.patient.uhid}</p>
                          </>
                        ) : (
                          <span className="text-faint">—</span>
                        )}
                      </td>
                      <td className="py-3 pl-4 font-mono text-xs text-slate">{row.ipAddress ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <ul className="divide-y divide-line lg:hidden">
              {rows.map((row) => (
                <li key={row.id} className="py-4 first:pt-0 last:pb-0">
                  <div className="flex items-start justify-between gap-3">
                    <What row={row} />
                    <Badge tone={ACTION_TONE[row.action]}>{t(`admin.audit.actions.${row.action}`)}</Badge>
                  </div>
                  <p className="mt-1 truncate text-xs text-slate">
                    {row.actor.email} · {t(`roles.${row.actor.role}`)}
                    {row.patient && ` → ${row.patient.fullName} (${row.patient.uhid})`}
                  </p>
                  <p className="mt-0.5 text-xs text-faint">
                    <When at={row.createdAt} />
                  </p>
                </li>
              ))}
            </ul>
          </div>
        )}
      </Card>
      {audit.data?.meta && rows.length > 0 && <Pagination meta={audit.data.meta} onPageChange={setPage} disabled={audit.isFetching} />}
    </>
  )
}
