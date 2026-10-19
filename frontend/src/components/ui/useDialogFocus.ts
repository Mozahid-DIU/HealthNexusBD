import { useEffect, useLayoutEffect, useRef, type RefObject } from 'react'

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

/** Open dialogs, innermost last. Only the top one handles keys; scroll unlocks with the last. */
const openDialogs: symbol[] = []
let savedOverflow = ''

function isFocusable(el: HTMLElement): boolean {
  return !el.closest('[hidden], [inert], [aria-hidden="true"]')
}

/**
 * Focus management for modal surfaces (dialogs, drawers): while `open`, focus moves
 * into `panelRef` and is trapped there, Esc calls `onClose` (when dismissible), page
 * scroll is locked, and focus returns to whatever had it before on close. Stacked
 * dialogs (e.g. a confirm over the drawer) only act on the topmost one.
 */
export function useDialogFocus(
  panelRef: RefObject<HTMLElement | null>,
  open: boolean,
  onClose: () => void,
  dismissible = true,
): void {
  // Latest callbacks without re-running the open/close effect on every render.
  const onCloseRef = useRef(onClose)
  const dismissibleRef = useRef(dismissible)
  useLayoutEffect(() => {
    onCloseRef.current = onClose
    dismissibleRef.current = dismissible
  })

  useEffect(() => {
    if (!open) return
    const panel = panelRef.current
    if (!panel) return
    const id = Symbol('dialog')
    const restoreTo = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const focusables = () => Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(isFocusable)
    const isTop = () => openDialogs[openDialogs.length - 1] === id

    if (openDialogs.length === 0) {
      savedOverflow = document.body.style.overflow
      document.body.style.overflow = 'hidden'
    }
    openDialogs.push(id)
    ;(focusables()[0] ?? panel).focus()

    const onKeyDown = (event: KeyboardEvent) => {
      if (!isTop()) return
      if (event.key === 'Escape') {
        event.preventDefault()
        if (dismissibleRef.current) onCloseRef.current()
        return
      }
      if (event.key !== 'Tab') return
      const items = focusables()
      if (items.length === 0) {
        event.preventDefault()
        panel.focus()
        return
      }
      const first = items[0]!
      const last = items[items.length - 1]!
      const active = document.activeElement
      if (event.shiftKey && (active === first || active === panel || !panel.contains(active))) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && (active === last || !panel.contains(active))) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      const index = openDialogs.indexOf(id)
      if (index !== -1) openDialogs.splice(index, 1)
      if (openDialogs.length === 0) document.body.style.overflow = savedOverflow
      // The trigger may be gone (e.g. it lived inside a closed drawer): fall back to main.
      const target = restoreTo?.isConnected ? restoreTo : document.getElementById('main-content')
      target?.focus()
    }
  }, [open, panelRef])
}
