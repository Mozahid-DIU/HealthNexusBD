import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { CircleCheck, CircleX, Info, X } from 'lucide-react'
import { useToastStore, type Toast } from '@/stores/toast'

const AUTO_DISMISS_MS = { success: 4000, info: 5000, error: 7000 } as const

const STYLE = {
  success: { icon: CircleCheck, ring: 'ring-emerald-200', iconColor: 'text-emerald-600' },
  error: { icon: CircleX, ring: 'ring-red-200', iconColor: 'text-red-600' },
  info: { icon: Info, ring: 'ring-brand/20', iconColor: 'text-brand' },
} as const

function ToastItem({ toast }: { toast: Toast }) {
  const { t } = useTranslation()
  const dismiss = useToastStore((s) => s.dismiss)
  // Hovering or focusing a toast pauses its timer, so nobody loses a message mid-read.
  const [paused, setPaused] = useState(false)
  const { icon: Icon, ring, iconColor } = STYLE[toast.tone]

  useEffect(() => {
    if (paused) return
    const timer = setTimeout(() => dismiss(toast.id), AUTO_DISMISS_MS[toast.tone])
    return () => clearTimeout(timer)
  }, [paused, toast.id, toast.tone, dismiss])

  return (
    <li
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      className={`pointer-events-auto flex w-full items-start gap-3 rounded-xl bg-white px-4 py-3 shadow-[0_12px_32px_rgba(15,27,45,0.16)] ring-1 ${ring}`}
    >
      <Icon aria-hidden className={`mt-0.5 h-5 w-5 shrink-0 ${iconColor}`} />
      <p className="flex-1 text-sm font-medium text-ink">{toast.message}</p>
      <button
        type="button"
        onClick={() => dismiss(toast.id)}
        aria-label={t('ui.dismiss')}
        className="-mr-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-faint hover:text-ink focus-visible:outline-2 focus-visible:outline-brand"
      >
        <X aria-hidden className="h-4 w-4" />
      </button>
    </li>
  )
}

/**
 * Renders queued toasts. Mount once near the app root. Errors go in an assertive
 * (`alert`) region and everything else in a polite (`status`) one, so screen readers
 * announce each message exactly once.
 */
export function Toaster() {
  const toasts = useToastStore((s) => s.toasts)
  const errors = toasts.filter((item) => item.tone === 'error')
  const others = toasts.filter((item) => item.tone !== 'error')
  return (
    <div className="pointer-events-none fixed inset-x-4 bottom-4 z-[110] flex flex-col gap-2 sm:left-auto sm:right-6 sm:w-[380px]">
      <ol role="alert" className="flex flex-col gap-2">
        {errors.map((item) => (
          <ToastItem key={item.id} toast={item} />
        ))}
      </ol>
      <ol role="status" className="flex flex-col gap-2">
        {others.map((item) => (
          <ToastItem key={item.id} toast={item} />
        ))}
      </ol>
    </div>
  )
}
