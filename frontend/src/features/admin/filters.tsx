import { useEffect, useId, useRef, useState } from 'react'
import { ChevronDown, Search, X } from 'lucide-react'

const DEBOUNCE_MS = 300

/**
 * Search box that reports after typing pauses (no request per keystroke). It follows
 * `value` when that changes from outside, e.g. "Clear filters".
 */
export function SearchField({
  label,
  placeholder,
  value,
  onChange,
  clearLabel,
}: {
  label: string
  placeholder: string
  value: string
  onChange: (value: string) => void
  clearLabel: string
}) {
  const id = useId()
  const [draft, setDraft] = useState(value)
  const emitted = useRef(value)

  // Follow the URL only when it changed from elsewhere (e.g. "Clear filters"); our own
  // update coming back must not overwrite what the user has typed since.
  useEffect(() => {
    if (value !== emitted.current) {
      emitted.current = value
      setDraft(value)
    }
  }, [value])
  useEffect(() => {
    if (draft.trim() === emitted.current) return
    const timer = window.setTimeout(() => {
      emitted.current = draft.trim()
      onChange(draft.trim())
    }, DEBOUNCE_MS)
    return () => window.clearTimeout(timer)
  }, [draft, onChange])

  return (
    <div className="relative min-w-0 flex-1">
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <Search aria-hidden className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-faint" />
      <input
        id={id}
        type="search"
        value={draft}
        onChange={(e) => setDraft(e.target.value.slice(0, 100))}
        placeholder={placeholder}
        autoComplete="off"
        spellCheck={false}
        className="w-full rounded-xl border border-line bg-white py-2.5 pl-10 pr-10 text-sm text-ink shadow-card outline-none transition placeholder:text-faint focus:border-brand focus:ring-4 focus:ring-brand/10 [&::-webkit-search-cancel-button]:hidden"
      />
      {draft && (
        <button
          type="button"
          onClick={() => {
            setDraft('')
            emitted.current = ''
            onChange('')
          }}
          aria-label={clearLabel}
          className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg text-faint hover:bg-surface-soft hover:text-ink focus-visible:outline-2 focus-visible:outline-brand"
        >
          <X aria-hidden className="h-4 w-4" />
        </button>
      )}
    </div>
  )
}

/** A compact native select for a filter bar; the label is for screen readers only. */
export function FilterSelect<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: T | ''
  options: Array<{ value: T | ''; label: string }>
  onChange: (value: T | '') => void
}) {
  const id = useId()
  return (
    <div className="relative">
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value as T | '')}
        className="w-full appearance-none rounded-xl border border-line bg-white py-2.5 pl-3.5 pr-9 text-sm font-semibold text-body shadow-card outline-none transition focus:border-brand focus:ring-4 focus:ring-brand/10"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown aria-hidden className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-faint" />
    </div>
  )
}
