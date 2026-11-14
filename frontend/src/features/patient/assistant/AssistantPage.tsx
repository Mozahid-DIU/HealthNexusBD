import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Paperclip, Plus, SendHorizontal, Sparkles, X } from 'lucide-react'
import { PageHeader } from '@/components/layout/dashboard/PageHeader'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { translateApiError } from '@/lib/errors'
import { useAuthStore } from '@/stores/auth'
import type { TranslationKey } from '@/i18n'
import { patientApi, patientKeys } from '../api'
import type { ChatAttachment } from '../types'
import { AttachPicker } from './AttachPicker'
import { ChatMessage, ThinkingBubble } from './ChatMessage'
import { ConsentGate } from './ConsentGate'
import { MAX_MESSAGE_CHARS, useAssistantChat } from './useAssistantChat'

const consentKey = (userId?: string) => `healthnexus-assistant-consent:${userId ?? 'anonymous'}`

/** Remembered per account on this device (a convenience; the server also requires it). */
function readConsent(userId?: string): boolean {
  try {
    return localStorage.getItem(consentKey(userId)) === 'yes'
  } catch {
    return false
  }
}

function saveConsent(userId?: string) {
  try {
    localStorage.setItem(consentKey(userId), 'yes')
  } catch {
    // Private mode: they will simply be asked again next time.
  }
}

const SUGGESTIONS: TranslationKey[] = [
  'patient.assistant.suggestReport',
  'patient.assistant.suggestDiet',
  'patient.assistant.suggestMedicines',
  'patient.assistant.suggestPressure',
]

/** The patient's Health Assistant: plain-language answers about their health and records. */
export function AssistantPage() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const userId = useAuthStore((s) => s.user?.id)
  const [consented, setConsented] = useState(() => readConsent(userId))
  const chat = useAssistantChat()
  const [draft, setDraft] = useState('')
  const [attachment, setAttachment] = useState<ChatAttachment | null>(null)
  const [pickerOpen, setPickerOpen] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Keep the newest message in view.
  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [chat.entries.length, chat.pending])

  const resize = () => {
    const el = inputRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`
  }

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

  const newChat = () => {
    chat.reset()
    setAttachment(null)
    setDraft('')
    inputRef.current?.focus()
  }

  const last = chat.entries[chat.entries.length - 1]
  const errorText = chat.error ? translateApiError(chat.error, t) : undefined

  return (
    <>
      <PageHeader
        title={
          <span className="inline-flex items-center gap-2.5">
            {t('patient.assistant.title')}
            <Badge tone="brand">{t('patient.assistant.aiBadge')}</Badge>
          </span>
        }
        description={t('patient.assistant.subtitle')}
        actions={
          consented && chat.entries.length > 0 ? (
            <Button variant="outline" size="sm" onClick={newChat}>
              <Plus aria-hidden className="h-4 w-4" />
              {t('patient.assistant.newChat')}
            </Button>
          ) : undefined
        }
      />

      <section
        aria-label={t('patient.assistant.title')}
        className="flex h-[calc(100dvh-14rem)] min-h-[540px] flex-col overflow-hidden rounded-3xl border border-line bg-gradient-to-b from-white via-white to-surface-soft shadow-card"
      >
        {!consented ? (
          <div className="flex-1 overflow-y-auto">
            <ConsentGate
              onAccept={() => {
                saveConsent(userId)
                setConsented(true)
              }}
            />
          </div>
        ) : (
          <>
            <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-6 sm:px-6">
              {chat.entries.length === 0 ? (
                <div className="mx-auto flex max-w-xl flex-col items-center pt-4 text-center sm:pt-10">
                  <span className="relative mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand to-teal text-white shadow-[0_14px_34px_-10px_rgba(11,92,173,0.65)]">
                    <Sparkles aria-hidden className="h-7 w-7" />
                  </span>
                  <h2 className="text-xl font-black tracking-tight text-ink">{t('patient.assistant.welcome')}</h2>
                  <p className="mt-2 max-w-md text-sm leading-relaxed text-slate">{t('patient.assistant.welcomeHint')}</p>
                  <p className="mb-3 mt-8 text-xs font-bold uppercase tracking-wide text-faint [:lang(bn)_&]:normal-case [:lang(bn)_&]:tracking-normal">
                    {t('patient.assistant.suggestionsLabel')}
                  </p>
                  <ul className="grid w-full gap-2 sm:grid-cols-2">
                    {SUGGESTIONS.map((key) => (
                      <li key={key}>
                        <button
                          type="button"
                          onClick={() => void suggest(key)}
                          className="h-full w-full rounded-2xl border border-line bg-white px-4 py-3 text-left text-sm font-semibold text-ink shadow-card transition hover:-translate-y-0.5 hover:border-brand/40 hover:text-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                        >
                          {t(key)}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
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

            <form onSubmit={onSubmit} className="border-t border-line bg-white/95 px-3 pb-3 pt-3 sm:px-5 sm:pb-4">
              <div className="mx-auto max-w-3xl">
                {chat.trimmed && <p className="mb-2 text-xs text-slate">{t('patient.assistant.trimmed')}</p>}
                {attachment && (
                  <span className="mb-2 inline-flex max-w-full items-center gap-1.5 rounded-full bg-brand/[0.08] py-1 pl-3 pr-1 text-xs font-semibold text-brand">
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
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-slate transition hover:bg-brand/[0.06] hover:text-brand focus-visible:outline-2 focus-visible:outline-brand"
                  >
                    <Paperclip aria-hidden className="h-5 w-5" />
                  </button>
                  <label htmlFor="assistant-message" className="sr-only">
                    {t('patient.assistant.messageLabel')}
                  </label>
                  <textarea
                    id="assistant-message"
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
          </>
        )}
      </section>

      <AttachPicker open={pickerOpen} onClose={() => setPickerOpen(false)} onPick={setAttachment} />
    </>
  )
}
