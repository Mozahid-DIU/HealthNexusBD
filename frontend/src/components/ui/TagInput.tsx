import { useId, useState, type KeyboardEvent, type ReactNode } from 'react'
import { X } from 'lucide-react'

interface TagInputProps {
  label: string
  value: string[]
  onChange: (tags: string[]) => void
  placeholder?: string
  hint?: ReactNode
  /** Accessible name for each tag's remove button, e.g. (tag) => `Remove ${tag}`. */
  removeLabel: (tag: string) => string
  maxTags?: number
  maxLength?: number
  tone?: 'brand' | 'danger'
}

/**
 * Chips entry: type and press Enter or comma to add, Backspace on an empty field removes
 * the last chip, pasting "a, b, c" adds all three. Duplicates (any case) are ignored.
 */
export function TagInput({
  label,
  value,
  onChange,
  placeholder,
  hint,
  removeLabel,
  maxTags = 30,
  maxLength = 100,
  tone = 'brand',
}: TagInputProps) {
  const id = useId()
  const [draft, setDraft] = useState('')

  const add = (raw: string) => {
    const next = [...value]
    const seen = new Set(next.map((v) => v.toLocaleLowerCase()))
    for (const part of raw.split(/[,\n]/)) {
      const tag = part.trim().slice(0, maxLength)
      if (tag && !seen.has(tag.toLocaleLowerCase()) && next.length < maxTags) {
        seen.add(tag.toLocaleLowerCase())
        next.push(tag)
      }
    }
    if (next.length !== value.length) onChange(next)
    setDraft('')
  }

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    // Enter while an input method (e.g. Bangla) is composing confirms the word, not the tag.
    if (event.nativeEvent.isComposing) return
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault()
      if (draft.trim()) add(draft)
    } else if (event.key === 'Backspace' && draft === '' && value.length > 0) {
      onChange(value.slice(0, -1))
    }
  }

  const chip = tone === 'danger' ? 'bg-red-50 text-red-700 ring-red-200' : 'bg-brand/[0.08] text-brand ring-brand/15'

  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-[13px] font-semibold text-body">
        {label}
      </label>
      <div className="flex min-h-[48px] flex-wrap items-center gap-2 rounded-xl border border-line bg-white px-3 py-2 transition focus-within:border-brand focus-within:ring-4 focus-within:ring-brand/10">
        {value.map((tag) => (
          <span key={tag} className={`inline-flex items-center gap-1 rounded-lg py-1 pl-2.5 pr-1 text-xs font-semibold ring-1 ring-inset ${chip}`}>
            {tag}
            <button
              type="button"
              onClick={() => onChange(value.filter((v) => v !== tag))}
              aria-label={removeLabel(tag)}
              className="flex h-5 w-5 items-center justify-center rounded-md hover:bg-black/5 focus-visible:outline-2 focus-visible:outline-brand"
            >
              <X aria-hidden className="h-3 w-3" />
            </button>
          </span>
        ))}
        <input
          id={id}
          value={draft}
          onChange={(e) => {
            const text = e.target.value
            // A pasted or typed comma list becomes chips immediately.
            if (text.includes(',')) add(text)
            else setDraft(text)
          }}
          onKeyDown={onKeyDown}
          onBlur={() => draft.trim() && add(draft)}
          placeholder={value.length === 0 ? placeholder : undefined}
          aria-describedby={hint ? `${id}-hint` : undefined}
          className="min-w-[8rem] flex-1 bg-transparent py-1 text-sm text-body outline-none placeholder:text-faint"
        />
      </div>
      {hint && (
        <p id={`${id}-hint`} className="mt-1 text-xs text-slate">
          {hint}
        </p>
      )}
    </div>
  )
}
