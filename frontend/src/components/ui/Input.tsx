import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { translateDynamic } from '@/i18n/dynamic'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  /** A translation key (from a Zod schema) or already-readable text. */
  error?: string
  hint?: ReactNode
  rightSlot?: ReactNode
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, hint, rightSlot, className = '', id, name, ...props },
  ref,
) {
  const { t } = useTranslation()
  const fieldId = id ?? name
  const errorText = error ? translateDynamic(t, error) : undefined
  const messageId = fieldId ? `${fieldId}-message` : undefined
  return (
    <div>
      <label htmlFor={fieldId} className="mb-1.5 block text-[13px] font-semibold text-body">
        {label}
      </label>
      <div className="relative">
        <input
          id={fieldId}
          name={name}
          ref={ref}
          className={`w-full rounded-xl border bg-white px-4 py-3 text-sm text-body outline-none transition
            placeholder:text-faint focus:ring-4 focus:ring-brand/10
            ${error ? 'border-red-400 focus:border-red-400' : 'border-line focus:border-brand'}
            ${rightSlot ? 'pr-11' : ''} ${className}`}
          aria-invalid={Boolean(error)}
          aria-describedby={error || hint ? messageId : undefined}
          {...props}
        />
        {rightSlot && <div className="absolute inset-y-0 right-2 flex items-center">{rightSlot}</div>}
      </div>
      {errorText ? (
        <p id={messageId} role="alert" className="mt-1 text-xs font-medium text-red-500">
          {errorText}
        </p>
      ) : hint ? (
        <p id={messageId} className="mt-1 text-xs text-slate">
          {hint}
        </p>
      ) : null}
    </div>
  )
})
