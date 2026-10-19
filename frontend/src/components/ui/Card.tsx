import type { HTMLAttributes, ReactNode } from 'react'

interface CardProps extends HTMLAttributes<HTMLElement> {
  as?: 'div' | 'section' | 'article'
  /** Padding preset; `none` for cards that manage their own (e.g. lists). */
  padding?: 'none' | 'md' | 'lg'
  children: ReactNode
}

const PADDING = { none: '', md: 'p-5 sm:p-6', lg: 'p-6 sm:p-8' } as const

/** The base surface for dashboard content. */
export function Card({ as: Tag = 'div', padding = 'md', className = '', children, ...props }: CardProps) {
  return (
    <Tag
      className={`rounded-2xl border border-line bg-white shadow-card ${PADDING[padding]} ${className}`}
      {...props}
    >
      {children}
    </Tag>
  )
}

interface CardHeaderProps {
  title: ReactNode
  description?: ReactNode
  action?: ReactNode
  /** id for aria-labelledby on the parent section. */
  id?: string
}

export function CardHeader({ title, description, action, id }: CardHeaderProps) {
  return (
    <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0">
        <h2 id={id} className="text-base font-bold text-ink">
          {title}
        </h2>
        {description && <p className="mt-0.5 text-sm text-slate">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}
