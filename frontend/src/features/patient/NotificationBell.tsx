import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { Bell } from 'lucide-react'
import { useLanguage } from '@/i18n/useLanguage'
import { formatNumber } from '@/lib/format'
import { patientApi, patientKeys } from './api'

/** Top-bar bell with the unread count; polls so new lab reports show up on their own. */
export function NotificationBell() {
  const { t } = useTranslation()
  const lang = useLanguage()
  const inbox = useQuery({
    queryKey: patientKeys.notifications(1),
    queryFn: () => patientApi.notifications(1),
    refetchInterval: 60_000,
    select: (res) => res.data.unreadCount,
  })
  const unread = inbox.data ?? 0

  return (
    <Link
      to="/patient/notifications"
      aria-label={t('patient.notifications.bell', { count: formatNumber(unread, lang) })}
      className="relative flex h-10 w-10 items-center justify-center rounded-lg text-slate transition hover:bg-surface-soft hover:text-brand focus-visible:outline-2 focus-visible:outline-brand"
    >
      <Bell aria-hidden className="h-5 w-5" />
      {unread > 0 && (
        <span
          aria-hidden
          className="absolute right-1 top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white ring-2 ring-white"
        >
          {unread > 99 ? `${formatNumber(99, lang)}+` : formatNumber(unread, lang)}
        </span>
      )}
    </Link>
  )
}
