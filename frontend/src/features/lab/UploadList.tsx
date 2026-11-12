import { useTranslation } from 'react-i18next'
import { FlaskConical } from 'lucide-react'
import { ReportFileActions } from '@/components/files/ReportFileActions'
import { useLanguage } from '@/i18n/useLanguage'
import { formatDateTime } from '@/lib/format'
import { labApi } from './api'
import type { LabUpload } from './types'

/** The lab's uploaded reports, newest first, each one viewable and downloadable. */
export function UploadList({ uploads }: { uploads: LabUpload[] }) {
  const { t } = useTranslation()
  const lang = useLanguage()
  return (
    <ul className="divide-y divide-line">
      {uploads.map((upload) => (
        <li key={upload.id} className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center">
          <span className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-teal/10 text-teal sm:flex">
            <FlaskConical aria-hidden className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[15px] font-bold text-ink">{upload.testName}</p>
            <p className="truncate text-sm text-body">
              {t('lab.history.patient', { name: upload.patient.fullName, uhid: upload.patient.uhid })}
            </p>
            <p className="text-xs text-slate">{t('files.uploaded', { date: formatDateTime(upload.uploadedAt, lang) })}</p>
          </div>
          <ReportFileActions
            title={`${upload.testName} · ${upload.patient.fullName}`}
            fetchFile={() => labApi.file(upload.id)}
          />
        </li>
      ))}
    </ul>
  )
}
