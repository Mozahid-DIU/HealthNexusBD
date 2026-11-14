import { useEffect, useId, useRef, type KeyboardEvent } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Maximize2, Plus, Sparkles, X } from 'lucide-react'
import { AssistantConversation } from './AssistantConversation'
import { useAssistantSession } from './AssistantSession'

const HEADER_BUTTON =
  'flex h-9 w-9 items-center justify-center rounded-xl text-white/85 transition hover:bg-white/15 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-white'

/**
 * The Health Assistant in a panel over the page's corner (a full-screen sheet on
 * phones). It is not modal: the page stays usable beside it on larger screens.
 */
export function AssistantPanel({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation()
  const { chat, consented, newChat } = useAssistantSession()
  const titleId = useId()
  const panelRef = useRef<HTMLDivElement>(null)

  // Before agreeing there is no message box to focus: start at the panel itself. Only on
  // opening; agreeing then moves focus to the message box.
  const consentedOnOpen = useRef(consented)
  useEffect(() => {
    if (!consentedOnOpen.current) panelRef.current?.focus()
  }, [])

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    // The attach picker is a modal rendered elsewhere in the page and handles its own Esc.
    if (e.key === 'Escape' && panelRef.current?.contains(e.target as Node)) {
      e.stopPropagation()
      onClose()
    }
  }

  return (
    <div
      ref={panelRef}
      role="dialog"
      aria-labelledby={titleId}
      tabIndex={-1}
      onKeyDown={onKeyDown}
      className="assistant-pop fixed inset-0 z-80 flex flex-col overflow-hidden bg-linear-to-b from-white via-white to-surface-soft outline-none sm:inset-auto sm:bottom-24 sm:right-6 sm:h-[min(680px,calc(100dvh-8rem))] sm:w-100 sm:rounded-3xl sm:border sm:border-line sm:shadow-[0_28px_70px_-18px_rgba(15,27,45,0.45)]"
    >
      <header className="relative flex items-center gap-3 overflow-hidden bg-linear-to-br from-brand to-teal px-4 py-3.5 text-white">
        <span aria-hidden className="pointer-events-none absolute -right-10 -top-12 h-32 w-32 rounded-full bg-white/10" />
        <span aria-hidden className="pointer-events-none absolute -bottom-16 right-16 h-28 w-28 rounded-full bg-white/6" />
        <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/25">
          <Sparkles aria-hidden className="h-5 w-5" />
        </span>
        <div className="relative min-w-0 flex-1">
          <h2 id={titleId} className="flex items-center gap-2 truncate text-[15px] font-extrabold leading-tight tracking-tight">
            {t('patient.assistant.title')}
            <span className="rounded-md bg-white/20 px-1.5 py-0.5 text-[10px] font-bold leading-none">{t('patient.assistant.aiBadge')}</span>
          </h2>
          <p className="truncate text-xs text-white/80">{t('dashboard.assistant.tagline')}</p>
        </div>
        <div className="relative flex shrink-0 items-center">
          {consented && chat.entries.length > 0 && (
            <button type="button" onClick={newChat} aria-label={t('patient.assistant.newChat')} title={t('patient.assistant.newChat')} className={HEADER_BUTTON}>
              <Plus aria-hidden className="h-4.5 w-4.5" />
            </button>
          )}
          <Link
            to="/patient/assistant"
            onClick={onClose}
            aria-label={t('dashboard.assistant.expand')}
            title={t('dashboard.assistant.expand')}
            className={`${HEADER_BUTTON} max-sm:hidden`}
          >
            <Maximize2 aria-hidden className="h-4 w-4" />
          </Link>
          <button type="button" onClick={onClose} aria-label={t('dashboard.assistant.close')} title={t('dashboard.assistant.close')} className={HEADER_BUTTON}>
            <X aria-hidden className="h-5 w-5" />
          </button>
        </div>
      </header>

      <AssistantConversation compact autoFocus />
    </div>
  )
}
