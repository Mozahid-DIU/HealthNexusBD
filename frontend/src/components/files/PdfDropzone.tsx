import { useEffect, useId, useRef, useState, type DragEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { FileText, FileUp, X } from 'lucide-react'
import { useLanguage } from '@/i18n/useLanguage'
import { formatFileSize, formatNumber } from '@/lib/format'
import { checkPdf, MAX_REPORT_MB, type PdfProblem } from '@/lib/pdfFile'

interface PdfDropzoneProps {
  file: File | null
  /** Called with a checked, valid PDF, or null when it is removed. */
  onChange: (file: File | null) => void
  disabled?: boolean
}

/** A file dropped next to the zone must not make the browser open it and leave the app. */
function useBlockStrayDrops() {
  useEffect(() => {
    const block = (event: Event) => event.preventDefault()
    window.addEventListener('dragover', block)
    window.addEventListener('drop', block)
    return () => {
      window.removeEventListener('dragover', block)
      window.removeEventListener('drop', block)
    }
  }, [])
}

/**
 * Drag a PDF in or choose one. The file is checked on the spot (type, size and its real
 * first bytes), so a wrong file is caught before any upload starts. Keyboard focus stays
 * on the control (Remove after choosing, the picker after removing) and the choice is
 * announced to screen readers.
 */
export function PdfDropzone({ file, onChange, disabled = false }: PdfDropzoneProps) {
  const { t } = useTranslation()
  const lang = useLanguage()
  const max = formatNumber(MAX_REPORT_MB, lang)
  const inputId = useId()
  const hintId = useId()
  const errorId = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const removeRef = useRef<HTMLButtonElement>(null)
  const focusNext = useRef<'remove' | 'input' | null>(null)
  const latestPick = useRef(0)
  const dragDepth = useRef(0)
  const [problem, setProblem] = useState<PdfProblem | null>(null)
  const [dragging, setDragging] = useState(false)
  useBlockStrayDrops()

  // Move focus once the element that should hold it exists.
  useEffect(() => {
    if (focusNext.current === 'remove') removeRef.current?.focus()
    if (focusNext.current === 'input') inputRef.current?.focus()
    focusNext.current = null
  }, [file])

  const take = async (picked: File | undefined) => {
    if (!picked || disabled) return
    const pick = ++latestPick.current
    const found = await checkPdf(picked)
    // A newer pick (or a remove) happened while this one was being checked.
    if (pick !== latestPick.current) return
    setProblem(found)
    if (!found) focusNext.current = 'remove'
    onChange(found ? null : picked)
  }

  const remove = () => {
    latestPick.current += 1
    focusNext.current = 'input'
    setProblem(null)
    onChange(null)
  }

  const onDrop = (event: DragEvent) => {
    event.preventDefault()
    dragDepth.current = 0
    setDragging(false)
    void take(event.dataTransfer.files[0])
  }

  const status = (
    <p role="status" className="sr-only">
      {file ? t('files.selected', { name: file.name, size: formatFileSize(file.size, lang) }) : ''}
    </p>
  )

  if (file) {
    return (
      <div>
        {status}
        <div className="flex items-center gap-3 rounded-2xl border border-line bg-surface-soft p-3.5">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600">
            <FileText aria-hidden className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-ink">{file.name}</p>
            <p className="text-xs text-slate">{formatFileSize(file.size, lang)}</p>
          </div>
          <button
            ref={removeRef}
            type="button"
            onClick={remove}
            disabled={disabled}
            aria-label={t('files.remove', { name: file.name })}
            className="flex h-10 w-10 items-center justify-center rounded-xl text-slate transition hover:bg-white hover:text-red-600 focus-visible:outline-2 focus-visible:outline-brand disabled:opacity-50"
          >
            <X aria-hidden className="h-4 w-4" />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div>
      {status}
      <label
        htmlFor={inputId}
        onDragEnter={(e) => {
          e.preventDefault()
          dragDepth.current += 1
          if (!disabled) setDragging(true)
        }}
        onDragOver={(e) => e.preventDefault()}
        // Entering a child fires dragleave on the parent; count so the highlight holds.
        onDragLeave={() => {
          dragDepth.current = Math.max(0, dragDepth.current - 1)
          if (dragDepth.current === 0) setDragging(false)
        }}
        onDrop={onDrop}
        className={`flex cursor-pointer flex-col items-center rounded-2xl border-2 border-dashed px-5 py-8 text-center transition focus-within:border-brand focus-within:ring-4 focus-within:ring-brand/10 ${
          dragging ? 'border-brand bg-brand/[0.05]' : problem ? 'border-red-300 bg-red-50/40' : 'border-line hover:border-brand/50 hover:bg-surface-soft'
        } ${disabled ? 'pointer-events-none opacity-60' : ''}`}
      >
        <span
          className={`mb-3 flex h-12 w-12 items-center justify-center rounded-2xl transition ${
            dragging ? 'scale-110 bg-brand text-white' : 'bg-brand/[0.08] text-brand'
          }`}
        >
          <FileUp aria-hidden className="h-6 w-6" />
        </span>
        <span className="text-sm font-bold text-ink">{dragging ? t('files.dropActive') : t('files.dropTitle')}</span>
        <span className="my-1 text-xs text-faint">{t('files.dropOr')}</span>
        <span className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-brand shadow-card ring-1 ring-line">
          {t('files.browse')}
        </span>
        <span id={hintId} className="mt-3 text-xs text-slate">
          {t('files.dropHint', { max })}
        </span>
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          accept="application/pdf,.pdf"
          className="sr-only"
          disabled={disabled}
          aria-label={t('files.browse')}
          aria-describedby={problem ? `${hintId} ${errorId}` : hintId}
          aria-invalid={problem ? true : undefined}
          onChange={(e) => {
            void take(e.target.files?.[0])
            // Allow choosing the same file again after fixing it.
            e.target.value = ''
          }}
        />
      </label>
      {problem && (
        <p id={errorId} role="alert" className="mt-2 text-sm font-medium text-red-600">
          {problem.key === 'files.tooLarge' ? t(problem.key, { size: formatFileSize(problem.bytes, lang), max }) : t(problem.key)}
        </p>
      )}
    </div>
  )
}
