import { lazy, Suspense, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { MessageCircleHeart, X } from 'lucide-react'

// The panel (and the chat UI inside it) downloads only when first opened.
const AssistantPanel = lazy(() => import('./AssistantPanel').then((m) => ({ default: m.AssistantPanel })))

/** Shown while the panel's code downloads, in the panel's own place. */
function PanelLoading() {
  const { t } = useTranslation()
  return (
    <div
      role="status"
      className="fixed inset-0 z-80 flex items-center justify-center bg-white sm:inset-auto sm:bottom-24 sm:right-6 sm:h-40 sm:w-100 sm:rounded-3xl sm:border sm:border-line sm:shadow-card"
    >
      <span className="h-6 w-6 animate-spin rounded-full border-2 border-brand/25 border-t-brand" aria-hidden />
      <span className="sr-only">{t('dashboard.assistant.loading')}</span>
    </div>
  )
}

/**
 * The round Health Assistant button in the corner of every patient page. It opens the
 * assistant in a panel; the conversation is shared with the full Health Assistant page.
 */
export function AssistantLauncher() {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)

  const close = () => {
    setOpen(false)
    buttonRef.current?.focus()
  }

  const label = t(open ? 'dashboard.assistant.close' : 'dashboard.assistant.open')

  return (
    <>
      {open && (
        <Suspense fallback={<PanelLoading />}>
          <AssistantPanel onClose={close} />
        </Suspense>
      )}
      {/* On phones the open panel fills the screen and has its own close button. */}
      <div className={`group fixed bottom-5 right-5 z-85 sm:bottom-6 sm:right-6 ${open ? 'max-sm:hidden' : ''}`}>
        {!open && (
          <span
            aria-hidden
            className="pointer-events-none absolute right-full top-1/2 mr-3 hidden -translate-y-1/2 translate-x-1 whitespace-nowrap rounded-xl bg-navy px-3 py-1.5 text-xs font-semibold text-white opacity-0 shadow-card transition group-hover:translate-x-0 group-hover:opacity-100 group-focus-within:translate-x-0 group-focus-within:opacity-100 sm:block"
          >
            {t('dashboard.nav.assistant')}
          </span>
        )}
        <button
          ref={buttonRef}
          type="button"
          onClick={() => (open ? close() : setOpen(true))}
          aria-label={label}
          aria-expanded={open}
          className="relative flex h-14 w-14 items-center justify-center rounded-full bg-linear-to-br from-brand to-teal text-white shadow-[0_14px_32px_-8px_rgba(11,92,173,0.7)] ring-4 ring-white transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_18px_38px_-8px_rgba(11,92,173,0.8)] active:translate-y-0 active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
        >
          {open ? (
            <X aria-hidden className="h-6 w-6" />
          ) : (
            <MessageCircleHeart aria-hidden className="h-6.5 w-6.5" />
          )}
        </button>
      </div>
    </>
  )
}
