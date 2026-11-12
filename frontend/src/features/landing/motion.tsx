import { useEffect, useRef, useState, type CSSProperties, type ElementType, type ReactNode } from 'react'

/** True when the visitor asked the OS for less motion. */
export function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function'
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false
}

/**
 * Becomes true once the element scrolls into view (and stays true). Without
 * IntersectionObserver (old browsers, tests) everything simply shows.
 */
export function useInView<T extends Element>(rootMargin = '0px 0px -12% 0px') {
  const ref = useRef<T>(null)
  const [inView, setInView] = useState(() => typeof IntersectionObserver === 'undefined')

  useEffect(() => {
    const el = ref.current
    if (!el || inView) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setInView(true)
          observer.disconnect()
        }
      },
      { rootMargin },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [inView, rootMargin])

  return [ref, inView] as const
}

/** Fades and lifts its children in as they enter the viewport. */
export function Reveal({
  children,
  delay = 0,
  as: Tag = 'div',
  className = '',
}: {
  children: ReactNode
  delay?: number
  as?: ElementType
  className?: string
}) {
  const [ref, inView] = useInView<HTMLElement>()
  return (
    <Tag ref={ref} data-shown={inView} className={`lp-reveal ${className}`} style={{ transitionDelay: `${delay}ms` } as CSSProperties}>
      {children}
    </Tag>
  )
}

/** Counts from 0 to `target` once `start` is true; jumps straight there for reduced motion. */
export function useCountUp(target: number, start: boolean, duration = 1400): number {
  const [value, setValue] = useState(0)
  useEffect(() => {
    if (!start) return
    if (prefersReducedMotion() || typeof requestAnimationFrame === 'undefined') {
      setValue(target)
      return
    }
    let frame = 0
    const began = performance.now()
    const tick = (now: number) => {
      const p = Math.min(1, (now - began) / duration)
      setValue(Math.round(target * (1 - (1 - p) ** 3)))
      if (p < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [target, start, duration])
  return value
}

/**
 * True only while the element is on screen and the tab is visible, so looping demos
 * pause when nobody can see them (unlike useInView, which stays true once seen).
 */
export function useVisible<T extends Element>() {
  const ref = useRef<T>(null)
  const [onScreen, setOnScreen] = useState(false)
  const [tabVisible, setTabVisible] = useState(() => typeof document === 'undefined' || document.visibilityState !== 'hidden')

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (typeof IntersectionObserver === 'undefined') {
      setOnScreen(true)
      return
    }
    const observer = new IntersectionObserver(([entry]) => setOnScreen(Boolean(entry?.isIntersecting)))
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const onChange = () => setTabVisible(document.visibilityState !== 'hidden')
    document.addEventListener('visibilitychange', onChange)
    return () => document.removeEventListener('visibilitychange', onChange)
  }, [])

  return [ref, onScreen && tabVisible] as const
}
