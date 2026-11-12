import type { ReactNode } from 'react'

interface SegmentedProps<T extends string | number> {
  /** Accessible name of the group, e.g. "Date range". */
  label: string
  options: Array<{ value: T; label: ReactNode }>
  value: T
  onChange: (value: T) => void
}

/**
 * A row of mutually exclusive toggle buttons (ranges, status filters). Each button
 * reports its state with aria-pressed, so it reads correctly without a radio pattern.
 */
export function Segmented<T extends string | number>({ label, options, value, onChange }: SegmentedProps<T>) {
  return (
    <div role="group" aria-label={label} className="inline-flex max-w-full overflow-x-auto rounded-xl bg-white p-1 shadow-card ring-1 ring-line">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={value === option.value}
          onClick={() => onChange(option.value)}
          className={`shrink-0 whitespace-nowrap rounded-lg px-3.5 py-1.5 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-brand ${
            value === option.value ? 'bg-navy text-white shadow-sm' : 'text-slate hover:bg-surface-soft hover:text-ink'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}
