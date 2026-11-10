import { forwardRef, type SelectHTMLAttributes } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronDown } from 'lucide-react'
import { translateDynamic } from '@/i18n/dynamic'

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string
  options: Array<{ value: string; label: string }>
  /** First, empty option (e.g. "Not set"). */
  placeholder?: string
  /** A translation key (from a Zod schema) or already-readable text. */
  error?: string
}

/** Native select styled like `Input` (native keeps it accessible and mobile-friendly). */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, options, placeholder, error, id, name, className = '', ...props },
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
      <div className="relative">
        <select
          id={fieldId}
          name={name}
          ref={ref}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? messageId : undefined}
          className={`w-full appearance-none rounded-xl border bg-white py-3 pl-4 pr-10 text-sm text-body outline-none transition focus:ring-4 focus:ring-brand/10 ${
            error ? 'border-red-400 focus:border-red-400' : 'border-line focus:border-brand'
          } ${className}`}
          {...props}
        >
          {placeholder !== undefined && <option value="">{placeholder}</option>}
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <ChevronDown aria-hidden className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-faint" />
      </div>
      {error && (
        <p id={messageId} role="alert" className="mt-1 text-xs font-medium text-red-500">
          {translateDynamic(t, error)}
        </p>
      )}
    </div>
  )
})
