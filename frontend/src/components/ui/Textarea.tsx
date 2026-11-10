import { forwardRef, type ReactNode, type TextareaHTMLAttributes } from 'react'
import { useTranslation } from 'react-i18next'
import { translateDynamic } from '@/i18n/dynamic'

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string
  /** A translation key (from a Zod schema) or already-readable text. */
  error?: string
  hint?: ReactNode
}

/** Multi-line text styled like `Input`. */
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, error, hint, id, name, className = '', rows = 4, ...props },
  ref,
) {
  const { t } = useTranslation()
  const fieldId = id ?? name
  const messageId = fieldId ? `${fieldId}-message` : undefined
  return (
    <div>
      <label htmlFor={fieldId} className="mb-1.5 block text-[13px] font-semibold text-body">
        {label}
      </label>
      <textarea
        id={fieldId}
        name={name}
        ref={ref}
        rows={rows}
        aria-invalid={Boolean(error)}
        aria-describedby={error || hint ? messageId : undefined}
        className={`w-full resize-y rounded-xl border bg-white px-4 py-3 text-sm text-body outline-none transition placeholder:text-faint focus:ring-4 focus:ring-brand/10 ${
          error ? 'border-red-400 focus:border-red-400' : 'border-line focus:border-brand'
        } ${className}`}
        {...props}
      />
      {error ? (
        <p id={messageId} role="alert" className="mt-1 text-xs font-medium text-red-500">
          {translateDynamic(t, error)}
        </p>
      ) : hint ? (
        <p id={messageId} className="mt-1 text-xs text-slate">
          {hint}
        </p>
      ) : null}
    </div>
  )
})
