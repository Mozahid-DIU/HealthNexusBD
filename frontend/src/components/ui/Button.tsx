import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Variant = 'primary' | 'outline' | 'ghost'
type Size = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  children: ReactNode
}

const base =
  'inline-flex items-center justify-center gap-2 rounded-xl font-semibold ' +
  'transition-all duration-150 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed ' +
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand'

const variants: Record<Variant, string> = {
  primary:
    'bg-brand text-white shadow-brand hover:bg-brand-dark hover:-translate-y-0.5 active:translate-y-0',
  outline: 'border-[1.5px] border-brand text-brand bg-white hover:bg-brand/[0.06]',
  ghost: 'text-slate hover:text-brand hover:bg-brand/[0.05]',
}

const sizes: Record<Size, string> = {
  sm: 'text-sm px-4 py-2',
  md: 'text-sm px-5 py-2.5',
  lg: 'text-[15px] px-7 py-3',
}

export function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  ...props
}: ButtonProps) {
  return (
    <button className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} {...props}>
      {children}
    </button>
  )
}
