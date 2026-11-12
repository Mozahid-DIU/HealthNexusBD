import { useLayoutEffect, useRef, useState } from 'react'

/**
 * The rendered width of an element, kept up to date as the layout changes, so charts
 * draw at real pixel size (crisp 2px lines, round dots) instead of a stretched viewBox.
 */
export function useElementWidth<T extends HTMLElement>(fallback = 640) {
  const ref = useRef<T>(null)
  const [width, setWidth] = useState(fallback)

  // Before paint, so a phone never flashes a too-wide first frame.
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const measure = () => {
      const next = Math.round(el.getBoundingClientRect().width)
      if (next > 0) setWidth(next)
    }
    measure()
    if (typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return [ref, width] as const
}
