import { useEffect, useRef, useState } from 'react'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  BellOff,
  CalendarClock,
  ChevronRight,
  FlaskConical,
  KeyRound,
  ShieldCheck,
  Stethoscope,
  type LucideIcon,
} from 'lucide-react'
import { PageHeader } from '@/components/layout/dashboard/PageHeader'
import { Card } from '@/components/ui/Card'
import { EmptyState, ErrorState, LoadingBlock } from '@/components/ui/Feedback'
import { Pagination } from '@/components/ui/Pagination'
import { useLanguage } from '@/i18n/useLanguage'
import { formatDateTime } from '@/lib/format'
import { patientApi, patientKeys } from './api'
import { notificationLink, notificationText } from './text'
import type { NotificationType } from './types'
import { useClampPage, usePageParam } from '@/lib/usePageParam'

const ICONS: Record<NotificationType, LucideIcon> = {
  lab_report: FlaskConical,
  follow_up: CalendarClock,
  consent_request: KeyRound,
  access_granted: ShieldCheck,
  new_record: Stethoscope,
}

export function NotificationsPage() {
  const { t } = useTranslation()
  const lang = useLanguage()
  const queryClient = useQueryClient()
  const [page, setPage] = usePageParam()
  // Unread when the patient opened the page: still highlighted after they are marked read.
  const [fresh, setFresh] = useState<ReadonlySet<string>>(() => new Set())

  const inbox = useQuery({
    queryKey: patientKeys.notifications(page),
    queryFn: () => patientApi.notifications(page),
    placeholderData: keepPreviousData,
  })
  useClampPage(page, inbox.data?.meta, setPage)

  // Opening the inbox counts as reading it: the bell's number clears straight away.
  // Every inbox query (this page, the bell, the overview) shares the unread count.
  const { mutate: markAllRead } = useMutation({
    mutationFn: patientApi.markAllRead,
    onSettled: () => queryClient.invalidateQueries({ queryKey: patientKeys.notificationsAll() }),
  })

  const data = inbox.data?.data
  // Each fetched inbox is marked at most once (a refetch after marking comes back read).
  const marked = useRef<unknown>(null)
  useEffect(() => {
    if (!data || marked.current === data || data.unreadCount === 0) return
    marked.current = data
    const unread = data.notifications.filter((n) => n.readAt === null).map((n) => n.id)
    if (unread.length > 0) setFresh((prev) => new Set([...prev, ...unread]))
    markAllRead()
  }, [data, markAllRead])

  const items = data?.notifications ?? []

  return (
    <>
      <PageHeader title={t('patient.notifications.title')} description={t('patient.notifications.subtitle')} />
      {inbox.isPending ? (
        <Card>
          <LoadingBlock lines={5} />
        </Card>
      ) : inbox.isError ? (
        <Card>
          <ErrorState error={inbox.error} onRetry={() => void inbox.refetch()} />
        </Card>
      ) : items.length === 0 ? (
        <Card>
          <EmptyState
            icon={<BellOff aria-hidden className="h-6 w-6" />}
            title={t('patient.notifications.empty')}
            description={t('patient.notifications.emptyBody')}
          />
        </Card>
      ) : (
        <>
          <ul className="space-y-3">
            {items.map((n) => {
              const { title, body } = notificationText(n, t, lang)
              const isNew = fresh.has(n.id) || n.readAt === null
              const Icon = ICONS[n.type] ?? CalendarClock
              return (
                <li key={n.id}>
                  <Link
                    to={notificationLink(n)}
                    className={`group flex gap-4 rounded-2xl border p-4 shadow-card transition hover:-translate-y-0.5 hover:border-brand/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand sm:p-5 ${
                      isNew ? 'border-brand/25 bg-white' : 'border-line bg-white/70'
                    }`}
                  >
                    <span
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                        isNew ? 'bg-brand/10 text-brand' : 'bg-slate-100 text-slate'
                      }`}
                    >
                      <Icon aria-hidden className="h-5 w-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="flex flex-wrap items-center gap-2 text-sm font-bold text-ink">
                        {title}
                        {isNew && (
                          <span className="rounded-full bg-brand px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white [:lang(bn)_&]:normal-case [:lang(bn)_&]:tracking-normal">
                            {t('patient.notifications.new')}
                          </span>
                        )}
                      </p>
                      <p className="mt-1 text-sm text-body">{body}</p>
                      <p className="mt-1.5 text-xs text-faint">{formatDateTime(n.createdAt, lang)}</p>
                    </div>
                    <span className="flex shrink-0 items-center gap-0.5 self-center text-xs font-semibold text-brand opacity-80 transition group-hover:opacity-100">
                      <span className="max-sm:sr-only">{t('patient.notifications.open')}</span>
                      <ChevronRight aria-hidden className="h-4 w-4 transition group-hover:translate-x-0.5" />
                    </span>
                  </Link>
                </li>
              )
            })}
          </ul>
          {inbox.data.meta && <Pagination meta={inbox.data.meta} onPageChange={setPage} disabled={inbox.isFetching} />}
        </>
      )}
    </>
  )
}
