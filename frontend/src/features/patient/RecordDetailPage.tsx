import type { ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Sparkles, TriangleAlert } from 'lucide-react'
import { PageHeader } from '@/components/layout/dashboard/PageHeader'
import { Badge } from '@/components/ui/Badge'
import { Card, CardHeader } from '@/components/ui/Card'
import { ErrorState, LoadingBlock } from '@/components/ui/Feedback'
import { useLanguage } from '@/i18n/useLanguage'
import { formatDate, formatDateTime } from '@/lib/format'
import { patientApi, patientKeys } from './api'
import { asList } from './text'
import type { AiSummary, Medication, Prescription } from './types'

function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wide text-faint">{label}</dt>
      <dd className="mt-1 text-sm font-semibold text-ink">{children}</dd>
    </div>
  )
}

function medicationsOf(p: Prescription): Medication[] {
  return Array.isArray(p.medications) ? p.medications.filter((m) => m && typeof m.name === 'string') : []
}

function PrescriptionCard({ prescription }: { prescription: Prescription }) {
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
                <th scope="col" className="px-4 py-2.5 font-semibold">{t('patient.record.medicine')}</th>
                <th scope="col" className="px-4 py-2.5 font-semibold">{t('patient.record.dose')}</th>
                <th scope="col" className="px-4 py-2.5 font-semibold">{t('patient.record.frequency')}</th>
                <th scope="col" className="px-4 py-2.5 font-semibold">{t('patient.record.duration')}</th>
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
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-faint">{t('patient.record.tests')}</p>
          <div className="flex flex-wrap gap-2">
            {tests.map((test) => (
              <Badge key={test} tone="brand">{test}</Badge>
            ))}
          </div>
        </div>
      )}
      {prescription.notes && (
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-faint">{t('patient.record.notes')}</p>
          <p className="whitespace-pre-line text-sm text-body">{prescription.notes}</p>
        </div>
      )}
    </div>
  )
}

function AlertList({ title, items }: { title: string; items: string[] }) {
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

function AiSummaryCard({ summary }: { summary: AiSummary }) {
  const { t } = useTranslation()
  const lang = useLanguage()
  return (
    <div className="space-y-4">
      <p className="whitespace-pre-line text-sm leading-relaxed text-body">{summary.summary}</p>
      <AlertList title={t('patient.record.allergyAlerts')} items={asList(summary.allergyAlerts)} />
      <AlertList title={t('patient.record.interactionAlerts')} items={asList(summary.interactionAlerts)} />
      <p className="text-xs text-slate">
        {t('patient.record.aiDisclaimer')} · {formatDateTime(summary.generatedAt, lang)}
      </p>
    </div>
  )
}

export function RecordDetailPage() {
  const { t } = useTranslation()
  const lang = useLanguage()
  const { recordId = '' } = useParams()
  const record = useQuery({
    queryKey: patientKeys.record(recordId),
    queryFn: () => patientApi.record(recordId),
    select: (res) => res.data,
    enabled: recordId !== '',
  })

  const back = (
    <Link to="/patient/records" className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-brand hover:underline">
      <ArrowLeft aria-hidden className="h-4 w-4" />
      {t('patient.record.back')}
    </Link>
  )

  if (record.isPending) {
    return (
      <>
        {back}
        <Card>
          <LoadingBlock lines={6} />
        </Card>
      </>
    )
  }
  if (record.isError) {
    return (
      <>
        {back}
        <Card>
          <ErrorState
            error={record.error}
            title={'status' in record.error && record.error.status === 404 ? t('patient.record.notFound') : undefined}
            onRetry={() => void record.refetch()}
          />
        </Card>
      </>
    )
  }

  const r = record.data
  const symptoms = asList(r.symptoms)
  const summaries = Array.isArray(r.aiSummaries) ? r.aiSummaries : []
  const latestSummary = [...summaries].sort((a, b) => b.generatedAt.localeCompare(a.generatedAt))[0]

  return (
    <>
      {back}
      <PageHeader title={r.diagnosis ?? t('patient.records.untitled')} />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-6">
          <Card as="section" aria-labelledby="note-heading">
            <CardHeader id="note-heading" title={t('patient.record.note')} />
            <p className="whitespace-pre-line text-sm leading-relaxed text-body">{r.content}</p>
            {symptoms.length > 0 && (
              <div className="mt-5">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-faint">{t('patient.record.symptoms')}</p>
                <div className="flex flex-wrap gap-2">
                  {symptoms.map((s) => (
                    <Badge key={s}>{s}</Badge>
                  ))}
                </div>
              </div>
            )}
          </Card>

          <Card as="section" aria-labelledby="rx-heading">
            <CardHeader id="rx-heading" title={t('patient.record.prescription')} />
            {r.prescriptions.length === 0 ? (
              <p className="text-sm text-slate">{t('patient.record.noPrescription')}</p>
            ) : (
              <div className="space-y-6 divide-y divide-line [&>*+*]:pt-6">
                {r.prescriptions.map((p) => (
                  <PrescriptionCard key={p.id} prescription={p} />
                ))}
              </div>
            )}
          </Card>

          {latestSummary && (
            <Card as="section" aria-labelledby="ai-heading" className="border-teal/30">
              <CardHeader
                id="ai-heading"
                title={
                  <span className="inline-flex items-center gap-2">
                    <Sparkles aria-hidden className="h-4 w-4 text-teal" />
                    {t('patient.record.aiTitle')}
                  </span>
                }
              />
              <AiSummaryCard summary={latestSummary} />
            </Card>
          )}
        </div>

        <Card as="aside" className="h-fit">
          <dl className="space-y-4">
            <Fact label={t('patient.record.visitDate')}>{formatDate(r.createdAt, lang)}</Fact>
            <Fact label={t('patient.record.doctor')}>
              {r.doctor?.fullName ?? t('patient.records.unknownDoctor')}
              {r.doctor?.specialization && <span className="block text-xs font-normal text-slate">{r.doctor.specialization}</span>}
            </Fact>
            {r.followUpDate && (
              <Fact label={t('patient.record.followUpDate')}>{formatDate(r.followUpDate, lang, { dateOnly: true })}</Fact>
            )}
          </dl>
        </Card>
      </div>
    </>
  )
}
