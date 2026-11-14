import type { ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Pill } from 'lucide-react'
import { PageHeader } from '@/components/layout/dashboard/PageHeader'
import { Badge } from '@/components/ui/Badge'
import { Card, CardHeader } from '@/components/ui/Card'
import { ErrorState, LoadingBlock } from '@/components/ui/Feedback'
import { useLanguage } from '@/i18n/useLanguage'
import { formatDate } from '@/lib/format'
import { patientApi, patientKeys } from './api'
import { asList } from './text'
import { PrescriptionCard, SideEffectsList, sideEffectEntries } from '@/features/clinical/ClinicalViews'

function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wide text-faint">{label}</dt>
      <dd className="mt-1 text-sm font-semibold text-ink">{children}</dd>
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
  // Patients get the plain-language medicine notes only: the clinical summary and its
  // alerts are written for the doctor and could read as instructions to change a dose.
  const sideEffects = latestSummary?.sideEffects ?? []
  const hasSideEffects = sideEffectEntries(sideEffects, lang).length > 0

  return (
    <>
      {back}
      <PageHeader title={r.diagnosis ?? t('patient.records.untitled')} />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 space-y-6">
          <Card as="section" aria-labelledby="note-heading">
            <CardHeader id="note-heading" title={t('clinical.note')} />
            <p className="whitespace-pre-line text-sm leading-relaxed text-body">{r.content}</p>
            {symptoms.length > 0 && (
              <div className="mt-5">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-faint">{t('clinical.symptoms')}</p>
                <div className="flex flex-wrap gap-2">
                  {symptoms.map((s) => (
                    <Badge key={s}>{s}</Badge>
                  ))}
                </div>
              </div>
            )}
          </Card>

          <Card as="section" aria-labelledby="rx-heading">
            <CardHeader id="rx-heading" title={t('clinical.prescription')} />
            {r.prescriptions.length === 0 ? (
              <p className="text-sm text-slate">{t('clinical.noPrescription')}</p>
            ) : (
              <div className="space-y-6 divide-y divide-line [&>*+*]:pt-6">
                {r.prescriptions.map((p) => (
                  <PrescriptionCard key={p.id} prescription={p} />
                ))}
              </div>
            )}
          </Card>

          {hasSideEffects && (
            <Card as="section" aria-labelledby="side-effects-heading" className="border-teal/30">
              <CardHeader
                id="side-effects-heading"
                title={
                  <span className="inline-flex items-center gap-2">
                    <Pill aria-hidden className="h-4 w-4 text-teal" />
                    {t('clinical.sideEffects.title')}
                  </span>
                }
              />
              <SideEffectsList items={sideEffects} framed={false} />
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
