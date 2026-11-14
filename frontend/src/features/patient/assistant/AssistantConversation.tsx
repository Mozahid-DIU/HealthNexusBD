import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Paperclip, SendHorizontal, Sparkles, X } from 'lucide-react'
import { translateApiError } from '@/lib/errors'
import type { TranslationKey } from '@/i18n'
import { patientApi, patientKeys } from '../api'
import { AttachPicker } from './AttachPicker'
import { useAssistantSession } from './AssistantSession'
import { ChatMessage, ThinkingBubble } from './ChatMessage'
import { ConsentGate } from './ConsentGate'
import { MAX_MESSAGE_CHARS } from './useAssistantChat'

const SUGGESTIONS: TranslationKey[] = [
  'patient.assistant.suggestReport',
  'patient.assistant.suggestDiet',
  'patient.assistant.suggestMedicines',
  'patient.assistant.suggestPressure',
]

/** The tallest the message box grows before it scrolls. */
const MAX_INPUT_HEIGHT = 160
/** Space kept above a new answer when it is scrolled into view. */
const ANSWER_TOP_GAP = 16

function Welcome({ compact, onSuggest }: { compact: boolean; onSuggest: (key: TranslationKey) => void }) {
  const { t } = useTranslation()
  return (
    <div className={`mx-auto flex max-w-xl flex-col items-center text-center ${compact ? 'pt-1' : 'pt-4 sm:pt-10'}`}>
      <span
        className={`relative flex items-center justify-center rounded-2xl bg-linear-to-br from-brand to-teal text-white shadow-[0_14px_34px_-10px_rgba(11,92,173,0.65)] ${
          compact ? 'mb-4 h-12 w-12' : 'mb-5 h-14 w-14'
        }`}
      >
        <Sparkles aria-hidden className={compact ? 'h-6 w-6' : 'h-7 w-7'} />
      </span>
      <h2 className={`font-black tracking-tight text-ink ${compact ? 'text-lg' : 'text-xl'}`}>{t('patient.assistant.welcome')}</h2>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-slate">{t('patient.assistant.welcomeHint')}</p>
      <p
        className={`mb-3 text-xs font-bold uppercase tracking-wide text-faint [:lang(bn)_&]:normal-case [:lang(bn)_&]:tracking-normal ${
          compact ? 'mt-6' : 'mt-8'
        }`}
      >
        {t('patient.assistant.suggestionsLabel')}
      </p>
      <ul className={`grid w-full gap-2 ${compact ? '' : 'sm:grid-cols-2'}`}>
        {SUGGESTIONS.map((key) => (
          <li key={key}>
            <button
              type="button"
              onClick={() => onSuggest(key)}
              className="h-full w-full rounded-2xl border border-line bg-white px-4 py-3 text-left text-sm font-semibold text-ink shadow-card transition hover:-translate-y-0.5 hover:border-brand/40 hover:text-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            >
              {t(key)}
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}

/**
 * The Health Assistant itself (agreement, welcome, messages and composer), shared by
 * the full page and the corner panel. `compact` fits it into the narrow panel.
 */
export function AssistantConversation({ compact = false, autoFocus = false }: { compact?: boolean; autoFocus?: boolean }) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const { chat, consented, accept, draft, setDraft, attachment, setAttachment } = useAssistantSession()
  const [pickerOpen, setPickerOpen] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Keep the newest message in view. A new answer is shown from its first line (a long
  // one would otherwise open at its end); a question or the thinking dots, at the bottom.
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const newest = chat.entries[chat.entries.length - 1]
    const item = el.querySelector<HTMLElement>('ol[role="log"] > li:last-child')
    el.scrollTop =
      newest?.role === 'model' && !chat.pending && item ? Math.max(0, item.offsetTop - ANSWER_TOP_GAP) : el.scrollHeight
    // Only when a message arrives or the thinking state changes, not on every render.
  }, [chat.entries.length, chat.pending])

  const resize = () => {
    const el = inputRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, MAX_INPUT_HEIGHT)}px`
  }

  // A draft carried over from the other view keeps its height; the panel starts typing-ready.
  useEffect(() => {
    resize()
    if (autoFocus && consented) inputRef.current?.focus()
  }, [autoFocus, consented])

  const submit = (text = draft, attached = attachment) => {
    if (!text.trim() || chat.pending) return
    chat.send(text, attached)
    setDraft('')
    setAttachment(null)
    requestAnimationFrame(() => {
      resize()
      inputRef.current?.focus()
    })
  }

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    submit()
  }

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter sends, Shift+Enter breaks the line; never while a Bangla keyboard is composing
    // (Safari reports the composing Enter only through keyCode 229).
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing && e.keyCode !== 229) {
      e.preventDefault()
      submit()
    }
  }

  /** "Explain my latest lab report" attaches that report; the others are plain questions. */
  const suggest = async (key: TranslationKey) => {
    const text = t(key)
    if (key !== 'patient.assistant.suggestReport') return submit(text, null)
    try {
      const latest = (
        await queryClient.fetchQuery({ queryKey: patientKeys.labReports(1, 1), queryFn: () => patientApi.labReports(1, 1) })
      ).data[0]
      submit(text, latest ? { kind: 'labReport', id: latest.id, title: latest.testName } : null)
    } catch {
      submit(text, null)
    }
  }

  if (!consented) {
    return (
      <div className="flex-1 overflow-y-auto">
        <ConsentGate onAccept={accept} />
      </div>
    )
  }

  const last = chat.entries[chat.entries.length - 1]
  const errorText = chat.error ? translateApiError(chat.error, t) : undefined
  const gutter = compact ? 'px-4' : 'px-4 sm:px-6'

  return (
    <>
      <div ref={scrollRef} className={`relative flex-1 overflow-y-auto overscroll-contain py-5 ${gutter} ${compact ? '' : 'sm:py-6'}`}>
        {chat.entries.length === 0 ? (
          <Welcome compact={compact} onSuggest={(key) => void suggest(key)} />
        ) : (
          <ol role="log" aria-live="polite" aria-relevant="additions" className="mx-auto max-w-3xl space-y-5">
            {chat.entries.map((entry) => (
              <ChatMessage
                key={entry.id}
                entry={entry}
                canRetry={entry === last && !chat.pending}
                errorText={errorText}
                onRetry={chat.retry}
              />
            ))}
            {chat.pending && <ThinkingBubble />}
          </ol>
        )}
      </div>

      <form onSubmit={onSubmit} className={`border-t border-line bg-white/95 pb-3 pt-3 ${compact ? 'px-3' : 'px-3 sm:px-5 sm:pb-4'}`}>
        <div className="mx-auto max-w-3xl">
          {chat.trimmed && <p className="mb-2 text-xs text-slate">{t('patient.assistant.trimmed')}</p>}
          {attachment && (
            <span className="mb-2 inline-flex max-w-full items-center gap-1.5 rounded-full bg-brand/8 py-1 pl-3 pr-1 text-xs font-semibold text-brand">
              <Paperclip aria-hidden className="h-3 w-3 shrink-0" />
              <span className="truncate">{t('patient.assistant.attached', { title: attachment.title })}</span>
              <button
                type="button"
                onClick={() => setAttachment(null)}
                aria-label={t('patient.assistant.removeAttachment')}
                className="flex h-5 w-5 items-center justify-center rounded-full hover:bg-brand/10 focus-visible:outline-2 focus-visible:outline-brand"
              >
                <X aria-hidden className="h-3 w-3" />
              </button>
            </span>
          )}
          <div className="flex items-end gap-1.5 rounded-2xl border border-line bg-white p-1.5 transition focus-within:border-brand focus-within:ring-4 focus-within:ring-brand/10">
            <button
              type="button"
              onClick={() => setPickerOpen(true)}
              aria-label={t('patient.assistant.attach')}
              title={t('patient.assistant.attach')}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-slate transition hover:bg-brand/6 hover:text-brand focus-visible:outline-2 focus-visible:outline-brand"
            >
              <Paperclip aria-hidden className="h-5 w-5" />
            </button>
            <label htmlFor={compact ? 'assistant-panel-message' : 'assistant-message'} className="sr-only">
              {t('patient.assistant.messageLabel')}
            </label>
            <textarea
              id={compact ? 'assistant-panel-message' : 'assistant-message'}
              ref={inputRef}
              rows={1}
              value={draft}
              maxLength={MAX_MESSAGE_CHARS}
              placeholder={t('patient.assistant.placeholder')}
              onChange={(e) => {
                setDraft(e.target.value)
                resize()
              }}
              onKeyDown={onKeyDown}
              className="max-h-40 min-h-10 flex-1 resize-none bg-transparent px-2 py-2.5 text-[15px] leading-snug text-body outline-none placeholder:text-faint"
            />
            <button
              type="submit"
              disabled={!draft.trim() || chat.pending}
              aria-label={t('patient.assistant.send')}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand text-white shadow-brand transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            >
              <SendHorizontal aria-hidden className="h-5 w-5" />
            </button>
          </div>
          <p className="mt-2 text-center text-[11px] text-slate">{t('patient.assistant.disclaimer')}</p>
        </div>
      </form>

      <AttachPicker open={pickerOpen} onClose={() => setPickerOpen(false)} onPick={setAttachment} />
    </>
  )
}
