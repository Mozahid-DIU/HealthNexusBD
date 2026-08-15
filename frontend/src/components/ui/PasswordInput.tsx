import { forwardRef, useState, type InputHTMLAttributes, type ReactNode } from 'react'
import { Input } from './Input'

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
  hint?: ReactNode
}

function EyeIcon({ open }: { open: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {open ? (
        <>
          <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" />
          <circle cx="12" cy="12" r="3" />
        </>
      ) : (
        <>
          <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c6.5 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
          <path d="M6.61 6.61A13.5 13.5 0 0 0 2 11s3.5 7 10 7a9.12 9.12 0 0 0 5.39-1.61" />
          <path d="m2 2 20 20" />
        </>
      )}
    </svg>
  )
}

export const PasswordInput = forwardRef<HTMLInputElement, Props>(function PasswordInput(props, ref) {
  const [show, setShow] = useState(false)
  return (
    <Input
      {...props}
      ref={ref}
      type={show ? 'text' : 'password'}
      rightSlot={
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-faint hover:text-brand"
          aria-label={show ? 'Hide password' : 'Show password'}
        >
          <EyeIcon open={show} />
        </button>
      }
    />
  )
})
