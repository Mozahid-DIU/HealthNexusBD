import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { FileText, FlaskConical, type LucideIcon } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { ErrorState, LoadingBlock } from '@/components/ui/Feedback'
import { useLanguage } from '@/i18n/useLanguage'
import { formatDate } from '@/lib/format'
import { patientApi, patientKeys } from '../api'
import type { ChatAttachment } from '../types'

/** How many of the newest visits and reports to offer. */
const LIMIT = 20

interface Option {
  attachment: ChatAttachment
  detail: string
}

function Section({
  title,
  icon: Icon,
  query,
  onPick,
}: {
  title: string
  icon: LucideIcon
  query: { isPending: boolean; error: unknown; data?: Option[]; refetch: () => unknown }
  onPick: (a: ChatAttachment) => void
}) {
  const { t } = useTranslation()
  return (
    <section aria-label={title}>
      <h3 className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate [:lang(bn)_&]:normal-case [:lang(bn)_&]:tracking-normal">
        <Icon aria-hidden className="h-3.5 w-3.5" />
        {title}
      </h3>
      {query.isPending ? (
        <LoadingBlock lines={2} />
      ) : query.error || !query.data ? (
        <ErrorState error={query.error} onRetry={() => void query.refetch()} />
      ) : query.data.length === 0 ? (
        <p className="rounded-xl bg-surface-soft px-4 py-3 text-sm text-slate">{t('patient.assistant.attachNone')}</p>
      ) : (
        <ul className="space-y-1.5">
          {query.data.map(({ attachment, detail }) => (
            <li key={attachment.id}>
              <button
                type="button"
                onClick={() => onPick(attachment)}
                className="flex w-full items-center justify-between gap-3 rounded-xl border border-line px-4 py-2.5 text-left transition hover:border-brand/40 hover:bg-brand/[0.04] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
              >
                <span className="min-w-0 truncate text-sm font-semibold text-ink">{attachment.title}</span>
                <span className="shrink-0 text-xs text-slate">{detail}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

/** Choose one of the patient's own visits or lab reports for the assistant to explain. */
export function AttachPicker({
  open,
  onClose,
  onPick,
}: {
  open: boolean
  onClose: () => void
  onPick: (attachment: ChatAttachment) => void
}) {
  const { t } = useTranslation()
  const lang = useLanguage()

  const visits = useQuery({
    queryKey: patientKeys.records(1, LIMIT),
    queryFn: () => patientApi.records(1, LIMIT),
    enabled: open,
    select: (res): Option[] =>
      res.data.map((r) => ({
        attachment: { kind: 'record', id: r.id, title: r.diagnosis ?? t('patient.records.untitled') },
        detail: formatDate(r.createdAt, lang),
      })),
  })
  const reports = useQuery({
    queryKey: patientKeys.labReports(1, LIMIT),
    queryFn: () => patientApi.labReports(1, LIMIT),
    enabled: open,
    select: (res): Option[] =>
      res.data.map((r) => ({
        attachment: { kind: 'labReport', id: r.id, title: r.testName },
        detail: formatDate(r.uploadedAt, lang),
      })),
  })

  const pick = (attachment: ChatAttachment) => {
    onPick(attachment)
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title={t('patient.assistant.attachTitle')} description={t('patient.assistant.attachHint')}>
      <div className="max-h-[60vh] space-y-5 overflow-y-auto pr-1">
        <Section title={t('patient.assistant.attachReports')} icon={FlaskConical} query={reports} onPick={pick} />
        <Section title={t('patient.assistant.attachVisits')} icon={FileText} query={visits} onPick={pick} />
      </div>
    </Modal>
  )
}
