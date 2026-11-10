import { useTranslation } from 'react-i18next'
import { TriangleAlert } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { useLanguage } from '@/i18n/useLanguage'
import { formatDateTime } from '@/lib/format'
import { asList } from '@/features/patient/text'
import type { AiSummary, Medication, Prescription } from '@/features/patient/types'

/* Read-only clinical views shared by the patient and doctor dashboards (strings: clinical.*). */

function medicationsOf(p: Prescription): Medication[] {
  return Array.isArray(p.medications) ? p.medications.filter((m) => m && typeof m.name === 'string') : []
}

export function PrescriptionCard({ prescription }: { prescription: Prescription }) {
  const { t } = useTranslation()
  const meds = medicationsOf(prescription)
  const tests = asList(prescription.recommendedTests)
  return (
    <div className="space-y-4">
      {meds.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-line">
          <table className="w-full min-w-[440px] text-left text-sm">
            <thead className="bg-surface-soft text-xs uppercase tracking-wide text-slate">
              <tr>
                <th scope="col" className="px-4 py-2.5 font-semibold">{t('clinical.medicine')}</th>
                <th scope="col" className="px-4 py-2.5 font-semibold">{t('clinical.dose')}</th>
                <th scope="col" className="px-4 py-2.5 font-semibold">{t('clinical.frequency')}</th>
                <th scope="col" className="px-4 py-2.5 font-semibold">{t('clinical.duration')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {meds.map((m, i) => (
                <tr key={`${m.name}-${i}`}>
                  <td className="px-4 py-2.5 font-semibold text-ink">{m.name}</td>
                  <td className="px-4 py-2.5 text-body">{m.dose}</td>
                  <td className="px-4 py-2.5 text-body">{m.frequency}</td>
                  <td className="px-4 py-2.5 text-body">{m.duration ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {tests.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-faint">{t('clinical.tests')}</p>
          <div className="flex flex-wrap gap-2">
            {tests.map((test) => (
              <Badge key={test} tone="brand">{test}</Badge>
            ))}
          </div>
        </div>
      )}
      {prescription.notes && (
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-faint">{t('clinical.notes')}</p>
          <p className="whitespace-pre-line text-sm text-body">{prescription.notes}</p>
        </div>
      )}
    </div>
  )
}

export function AlertList({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) return null
  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
      <p className="mb-2 flex items-center gap-2 text-sm font-bold text-amber-800">
        <TriangleAlert aria-hidden className="h-4 w-4" />
        {title}
      </p>
      <ul className="list-disc space-y-1 pl-5 text-sm text-amber-900">
        {items.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>
    </div>
  )
}

export function AiSummaryCard({ summary }: { summary: AiSummary }) {
  const { t } = useTranslation()
  const lang = useLanguage()
  return (
    <div className="space-y-4">
      <p className="whitespace-pre-line text-sm leading-relaxed text-body">{summary.summary}</p>
      <AlertList title={t('clinical.allergyAlerts')} items={asList(summary.allergyAlerts)} />
      <AlertList title={t('clinical.interactionAlerts')} items={asList(summary.interactionAlerts)} />
      <p className="text-xs text-slate">
        {t('clinical.aiDisclaimer')} · {formatDateTime(summary.generatedAt, lang)}
      </p>
    </div>
  )
}
