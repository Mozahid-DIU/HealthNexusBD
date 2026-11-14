import { useTranslation } from 'react-i18next'
import { CircleAlert, Paperclip, Phone, Pill, RotateCw, Sparkles } from 'lucide-react'
import { looksLikeEmergency } from './emergency'
import { FormattedText } from './FormattedText'
import type { ChatEntry } from './useAssistantChat'

/** The 999 call-out: above an emergency answer, and under an emergency question that failed to send. */
function EmergencyCallout({ className = '' }: { className?: string }) {
  const { t } = useTranslation()
  return (
    <div role="alert" className={`rounded-2xl border border-red-200 bg-red-50 p-3.5 ${className}`}>
      <p className="flex items-center gap-2 text-sm font-bold text-red-700">
        <CircleAlert aria-hidden className="h-4 w-4" />
        {t('patient.assistant.emergencyTitle')}
      </p>
      <a
        href="tel:999"
        className="mt-2.5 inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-bold text-white shadow-[0_6px_16px_-6px_rgba(220,38,38,0.7)] transition hover:bg-red-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
      >
        <Phone aria-hidden className="h-4 w-4" />
        {t('patient.assistant.callNow')}
      </a>
    </div>
  )
}

function AttachmentTag({ title, label }: { title: string; label: 'attached' | 'shared' }) {
  const { t } = useTranslation()
  return (
    <span className="mb-2 inline-flex max-w-full items-center gap-1.5 rounded-full bg-black/6 px-2.5 py-1 text-xs font-semibold">
      <Paperclip aria-hidden className="h-3 w-3 shrink-0" />
      <span className="truncate">{t(label === 'attached' ? 'patient.assistant.attached' : 'patient.assistant.shared', { title })}</span>
    </span>
  )
}

/** One bubble: the patient's on the right, the assistant's on the left with its mark. */
export function ChatMessage({
  entry,
  canRetry,
  errorText,
  onRetry,
}: {
  entry: ChatEntry
  /** Only the latest unanswered question can be sent again. */
  canRetry: boolean
  /** Why the latest question failed (busy AI, rate limit, offline…). */
  errorText?: string
  onRetry: () => void
}) {
  const { t } = useTranslation()

  if (entry.role === 'user') {
    return (
      <li className="flex flex-col items-end">
        <div className="max-w-[85%] rounded-2xl rounded-br-md bg-brand px-4 py-2.5 text-[15px] leading-relaxed text-white shadow-[0_6px_18px_-8px_rgba(11,92,173,0.6)] sm:max-w-[75%]">
          <span className="sr-only">{t('patient.assistant.you')}: </span>
          {entry.attachment && <AttachmentTag title={entry.attachment.title} label="attached" />}
          <p className="whitespace-pre-line wrap-break-word">{entry.text}</p>
        </div>
        {entry.failed && (
          <p role="alert" className="mt-1.5 flex items-center gap-2 text-xs font-semibold text-red-600">
            <CircleAlert aria-hidden className="h-3.5 w-3.5" />
            {canRetry && errorText ? errorText : t('errors.aiUnavailable')}
            {canRetry && (
              <button
                type="button"
                onClick={onRetry}
                className="inline-flex items-center gap-1 rounded text-brand hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
              >
                <RotateCw aria-hidden className="h-3 w-3" />
                {t('patient.assistant.retry')}
              </button>
            )}
          </p>
        )}
        {/* No answer came (offline, limit, server down): an emergency still gets the 999 button. */}
        {entry.failed && looksLikeEmergency(entry.text) && <EmergencyCallout className="mt-2 max-w-[85%] sm:max-w-[75%]" />}
      </li>
    )
  }

  return (
    <li className="flex gap-3">
      <span aria-hidden className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-brand to-teal text-white">
        <Sparkles className="h-4 w-4" />
      </span>
      <div className="min-w-0 max-w-[85%] sm:max-w-[80%]">
        <span className="sr-only">{t('patient.assistant.name')}: </span>
        {entry.emergency && <EmergencyCallout className="mb-2" />}
        <div className="rounded-2xl rounded-tl-md border border-line bg-white px-4 py-3 text-[15px] leading-relaxed text-body shadow-card">
          {entry.attachment && <AttachmentTag title={entry.attachment.title} label="shared" />}
          <FormattedText text={entry.text} />
          {entry.medicineCaution && (
            <p className="mt-3 flex gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[13px] font-semibold leading-snug text-amber-900">
              <Pill aria-hidden className="mt-0.5 h-4 w-4 shrink-0" />
              {t('patient.assistant.medicineCaution')}
            </p>
          )}
        </div>
      </div>
    </li>
  )
}

/** Three dots while the assistant is thinking. */
export function ThinkingBubble() {
  const { t } = useTranslation()
  return (
    <li className="flex gap-3">
      <span className="sr-only">{t('patient.assistant.thinking')}</span>
      <span aria-hidden className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-brand to-teal text-white">
        <Sparkles className="h-4 w-4" />
      </span>
      <div className="flex items-center gap-1.5 rounded-2xl rounded-tl-md border border-line bg-white px-4 py-3.5 shadow-card">
        {[0, 150, 300].map((delay) => (
          <span
            key={delay}
            aria-hidden
            className="h-2 w-2 animate-bounce rounded-full bg-teal/70"
            style={{ animationDelay: `${delay}ms` }}
          />
        ))}
      </div>
    </li>
  )
}
