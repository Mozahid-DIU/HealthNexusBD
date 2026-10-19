import { useId, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { X } from 'lucide-react'
import { Button } from './Button'
import { useDialogFocus } from './useDialogFocus'

interface ModalProps {
  open: boolean
  onClose: () => void
  title: ReactNode
  description?: ReactNode
  children?: ReactNode
  footer?: ReactNode
  size?: 'sm' | 'md' | 'lg'
  /** Block closing (e.g. while a request is in flight). */
  dismissible?: boolean
}

const SIZES = { sm: 'sm:max-w-sm', md: 'sm:max-w-md', lg: 'sm:max-w-2xl' } as const

/**
 * Accessible modal dialog: focus moves inside and is trapped there, Esc and the
 * backdrop close it, page scroll is locked, and focus returns to the trigger on close.
 * On phones it docks to the bottom of the screen like a sheet.
 */
export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
  dismissible = true,
}: ModalProps) {
  const { t } = useTranslation()
  const titleId = useId()
  const descriptionId = useId()
  const panelRef = useRef<HTMLDivElement>(null)

  useDialogFocus(panelRef, open, onClose, dismissible)

  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center sm:p-4">
      <div
        aria-hidden
        className="absolute inset-0 bg-navy/50 backdrop-blur-[2px]"
        onClick={() => dismissible && onClose()}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        tabIndex={-1}
        className={`relative flex max-h-[92vh] w-full flex-col rounded-t-2xl bg-white shadow-[0_24px_64px_rgba(15,27,45,0.28)] outline-none sm:rounded-2xl ${SIZES[size]}`}
      >
        <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4 sm:px-6">
          <div className="min-w-0">
            <h2 id={titleId} className="text-base font-bold text-ink">
              {title}
            </h2>
            {description && (
              <p id={descriptionId} className="mt-1 text-sm text-slate">
                {description}
              </p>
            )}
          </div>
          {dismissible && (
            <button
              type="button"
              onClick={onClose}
              aria-label={t('common.close')}
              className="-mr-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-faint transition hover:bg-surface-soft hover:text-ink focus-visible:outline-2 focus-visible:outline-brand"
            >
              <X aria-hidden className="h-4 w-4" />
            </button>
          )}
        </div>
        {children && <div className="overflow-y-auto px-5 py-5 sm:px-6">{children}</div>}
        {footer && (
          <div className="flex flex-col-reverse gap-2 border-t border-line px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  )
}

interface ConfirmDialogProps {
  open: boolean
  title: ReactNode
  description?: ReactNode
  confirmLabel: ReactNode
  onConfirm: () => void
  onCancel: () => void
  tone?: 'primary' | 'danger'
  /** While true, the dialog can't be dismissed and the confirm button shows progress. */
  busy?: boolean
}

/** "Are you sure?" for destructive or irreversible actions. */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  onConfirm,
  onCancel,
  tone = 'primary',
  busy = false,
}: ConfirmDialogProps) {
  const { t } = useTranslation()
  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={title}
      description={description}
      size="sm"
      dismissible={!busy}
      footer={
        <>
          <Button variant="ghost" onClick={onCancel} disabled={busy}>
            {t('common.cancel')}
          </Button>
          <Button
            onClick={onConfirm}
            disabled={busy}
            aria-busy={busy}
            className={tone === 'danger' ? '!bg-red-600 !shadow-none hover:!bg-red-700' : ''}
          >
            {busy ? t('common.loading') : confirmLabel}
          </Button>
        </>
      }
    />
  )
}
