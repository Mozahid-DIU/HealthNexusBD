import type { ReactNode } from 'react'

/** Centered page container matching the design's 1120px max content width. */
export function Container({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`mx-auto w-full max-w-[1120px] px-6 ${className}`}>{children}</div>
}
