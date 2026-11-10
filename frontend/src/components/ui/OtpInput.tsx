import { useEffect, useRef, type ClipboardEvent, type KeyboardEvent } from 'react'

interface OtpInputProps {
  value: string
  onChange: (code: string) => void
  /** Accessible name for the group, e.g. "6-digit consent code". */
  label: string
  length?: number
  disabled?: boolean
  /** Keeps focus but ignores edits, e.g. while the code is being checked. */
  readOnly?: boolean
  invalid?: boolean
  autoFocus?: boolean
  /** Called once all digits are filled (e.g. to submit). */
  onComplete?: (code: string) => void
}

/**
 * One box per digit: typing advances, Backspace goes back, arrows move, and pasting a
 * full code fills every box. Numeric keyboard on phones; `one-time-code` lets the OS
 * offer an SMS code.
 */
export function OtpInput({
  value,
  onChange,
  label,
  length = 6,
  disabled = false,
  readOnly = false,
  invalid = false,
  autoFocus = false,
  onComplete,
}: OtpInputProps) {
  const refs = useRef<Array<HTMLInputElement | null>>([])
  const digits = Array.from({ length }, (_, i) => value[i] ?? '')

  const commit = (next: string) => {
    const clean = next.replace(/\D/g, '').slice(0, length)
    onChange(clean)
    if (clean.length === length) onComplete?.(clean)
  }

  const focus = (i: number) => refs.current[Math.max(0, Math.min(length - 1, i))]?.focus()
  const locked = disabled || readOnly

  // When the parent clears the code (e.g. a wrong attempt) while the user is still in the
  // boxes, put them back at the start so they can simply type again.
  useEffect(() => {
    if (value !== '') return
    const active = document.activeElement
    if (active && active !== refs.current[0] && refs.current.includes(active as HTMLInputElement)) {
      refs.current[0]?.focus()
    }
  }, [value])

  const onInput = (i: number, raw: string) => {
    if (locked) return
    if (raw === '') {
      // Some phone keyboards report deletion only as an emptied box, not a Backspace key.
      onChange(value.slice(0, i) + value.slice(i + 1))
      return
    }
    const typed = raw.replace(/\D/g, '')
    if (!typed) return
    if (typed.length > 1) {
      // Autofill or a fast typist put several digits in one box.
      commit((value.slice(0, i) + typed).slice(0, length))
      focus(i + typed.length)
      return
    }
    // The code is always a contiguous run of digits: typing past the end appends.
    const pos = Math.min(i, value.length)
    commit(value.slice(0, pos) + typed + value.slice(pos + 1))
    focus(pos + 1)
  }

  const onKeyDown = (i: number, event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Backspace') {
      if (locked) return
      event.preventDefault()
      if (i < value.length) {
        onChange(value.slice(0, i) + value.slice(i + 1))
      } else if (value.length > 0) {
        onChange(value.slice(0, -1))
        focus(value.length - 1)
      }
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault()
      focus(i - 1)
    } else if (event.key === 'ArrowRight') {
      event.preventDefault()
      focus(i + 1)
    }
  }

  const onPaste = (event: ClipboardEvent<HTMLInputElement>) => {
    const pasted = event.clipboardData.getData('text').replace(/\D/g, '')
    if (!pasted || locked) return
    event.preventDefault()
    commit(pasted)
    focus(pasted.length)
  }

  return (
    <div role="group" aria-label={label} className="flex justify-center gap-2 sm:gap-3">
      {digits.map((digit, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el
          }}
          value={digit}
          onChange={(e) => onInput(i, e.target.value)}
          onKeyDown={(e) => onKeyDown(i, e)}
          onPaste={onPaste}
          onFocus={(e) => e.target.select()}
          inputMode="numeric"
          autoComplete={i === 0 ? 'one-time-code' : 'off'}
          maxLength={length}
          disabled={disabled}
          readOnly={readOnly}
          autoFocus={autoFocus && i === 0}
          aria-label={`${label} ${i + 1}`}
          aria-invalid={invalid}
          className={`h-14 w-11 rounded-xl border-2 bg-white text-center font-mono text-2xl font-bold text-ink outline-none transition focus:border-brand focus:ring-4 focus:ring-brand/15 disabled:opacity-60 sm:h-16 sm:w-13 ${
            invalid ? 'border-red-400' : digit ? 'border-brand/50' : 'border-line'
          }`}
        />
      ))}
    </div>
  )
}
