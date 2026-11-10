import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Download, Eye } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Spinner } from '@/components/ui/Feedback'
import { translateApiError } from '@/lib/errors'
import { toast } from '@/stores/toast'

interface ReportFileActionsProps {
  /** Fetches the decrypted PDF (protected endpoints need the auth header, so no plain link). */
  fetchFile: () => Promise<Blob>
  /** Shown as the viewer title and used for the downloaded file name. */
  title: string
}

function safeFileName(name: string): string {
  return `${name.replace(/[^\p{L}\p{N}._-]+/gu, '_').slice(0, 80) || 'report'}.pdf`
}

/**
 * "View" (in-page viewer) and "Download" for an encrypted lab report. The PDF lives in
 * a short-lived object URL that is revoked as soon as it is no longer shown.
 */
export function ReportFileActions({ fetchFile, title }: ReportFileActionsProps) {
  const { t } = useTranslation()
  const [busy, setBusy] = useState<'view' | 'download' | null>(null)
  const [viewUrl, setViewUrl] = useState<string | null>(null)

  // Free the decrypted file from memory when the viewer closes or the row unmounts.
  useEffect(() => {
    if (!viewUrl) return
    return () => URL.revokeObjectURL(viewUrl)
  }, [viewUrl])

  // A fetch can finish after the user has left the page; then nothing may keep the file.
  const mounted = useRef(true)
  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])

  const load = async (mode: 'view' | 'download') => {
    setBusy(mode)
    try {
      const blob = await fetchFile()
      if (!mounted.current) return
      const url = URL.createObjectURL(blob)
      if (mode === 'view') {
        setViewUrl(url)
      } else {
        const link = document.createElement('a')
        link.href = url
        link.download = safeFileName(title)
        document.body.appendChild(link)
        link.click()
        link.remove()
        // Give the browser a moment to start the download before freeing the URL.
        setTimeout(() => URL.revokeObjectURL(url), 10_000)
      }
    } catch (error) {
      if (mounted.current) toast.error(translateApiError(error, t))
    } finally {
      if (mounted.current) setBusy(null)
    }
  }

  return (
    <>
      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => void load('view')}
          disabled={busy !== null}
          aria-label={`${t('files.view')}: ${title}`}
        >
          {busy === 'view' ? <Spinner label={t('files.opening')} /> : <><Eye aria-hidden className="h-4 w-4" />{t('files.view')}</>}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => void load('download')}
          disabled={busy !== null}
          aria-busy={busy === 'download'}
          aria-label={`${t('files.download')}: ${title}`}
        >
          <Download aria-hidden className="h-4 w-4" />
          {t('files.download')}
        </Button>
      </div>

      <Modal
        open={viewUrl !== null}
        onClose={() => setViewUrl(null)}
        title={title}
        size="lg"
        footer={
          viewUrl && (
            <a
              href={viewUrl}
              download={safeFileName(title)}
              className="inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-brand ring-1 ring-brand/30 hover:bg-brand/[0.05] focus-visible:outline-2 focus-visible:outline-brand"
            >
              <Download aria-hidden className="h-4 w-4" />
              {t('files.download')}
            </a>
          )
        }
      >
        {viewUrl && (
          <>
            <iframe src={viewUrl} title={title} className="h-[65vh] w-full rounded-lg border border-line" />
            <p className="mt-3 text-xs text-slate">{t('files.viewerFallback')}</p>
          </>
        )}
      </Modal>
    </>
  )
}
