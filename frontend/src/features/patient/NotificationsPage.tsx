import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { BellOff, CalendarClock, CheckCheck, FlaskConical } from 'lucide-react'
import { PageHeader } from '@/components/layout/dashboard/PageHeader'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState, ErrorState, LoadingBlock } from '@/components/ui/Feedback'
import { Pagination } from '@/components/ui/Pagination'
import { useLanguage } from '@/i18n/useLanguage'
import { formatDateTime } from '@/lib/format'
import { translateApiError } from '@/lib/errors'
import { toast } from '@/stores/toast'
import { patientApi, patientKeys } from './api'
import { notificationText } from './text'
import { useClampPage, usePageParam } from './usePageParam'

export function NotificationsPage() {
  const { t } = useTranslation()
  const lang = useLanguage()
  const queryClient = useQueryClient()
  const [page, setPage] = usePageParam()

  const inbox = useQuery({
    queryKey: patientKeys.notifications(page),
    queryFn: () => patientApi.notifications(page),
    placeholderData: keepPreviousData,
  })
  useClampPage(page, inbox.data?.meta, setPage)

  // Every inbox query (this page, the bell, the overview) shares the unread count.
  const refresh = () => queryClient.invalidateQueries({ queryKey: patientKeys.notificationsAll() })
  const onError = (error: unknown) => toast.error(translateApiError(error, t))

  const markOne = useMutation({ mutationFn: patientApi.markRead, onSettled: refresh, onError })
  const markAll = useMutation({ mutationFn: patientApi.markAllRead, onSettled: refresh, onError })

  const unread = inbox.data?.data.unreadCount ?? 0
  const items = inbox.data?.data.notifications ?? []

  return (
    <>
      <PageHeader
        title={t('patient.notifications.title')}
        description={t('patient.notifications.subtitle')}
        actions={
          unread > 0 && (
            <Button variant="outline" size="sm" onClick={() => markAll.mutate()} disabled={markAll.isPending}>
              <CheckCheck aria-hidden className="h-4 w-4" />
              {t('patient.notifications.markAll')}
            </Button>
          )
        }
      />
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
              const isUnread = n.readAt === null
              const Icon = n.type === 'lab_report' ? FlaskConical : CalendarClock
              return (
                <li
                  key={n.id}
                  className={`flex gap-4 rounded-2xl border p-4 shadow-card sm:p-5 ${
                    isUnread ? 'border-brand/25 bg-white' : 'border-line bg-white/70'
                  }`}
                >
                  <span
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                      isUnread ? 'bg-brand/10 text-brand' : 'bg-slate-100 text-slate'
                    }`}
                  >
                    <Icon aria-hidden className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-center gap-2 text-sm font-bold text-ink">
                      {title}
                      {isUnread && (
                        <span className="rounded-full bg-brand px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                          {t('patient.notifications.unread')}
                        </span>
                      )}
                    </p>
                    <p className="mt-1 text-sm text-body">{body}</p>
                    <p className="mt-1.5 text-xs text-faint">{formatDateTime(n.createdAt, lang)}</p>
                  </div>
                  {isUnread && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="self-start"
                      aria-label={`${t('patient.notifications.markRead')}: ${title}`}
                      onClick={() => markOne.mutate(n.id)}
                      disabled={markOne.isPending && markOne.variables === n.id}
                    >
                      {t('patient.notifications.markRead')}
                    </Button>
                  )}
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
