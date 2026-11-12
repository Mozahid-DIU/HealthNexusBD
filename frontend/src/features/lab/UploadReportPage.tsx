import { useEffect, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router-dom'
import { CircleCheck, ClipboardList, Clock, FlaskConical, Upload, UserRound } from 'lucide-react'
import { PageHeader } from '@/components/layout/dashboard/PageHeader'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState, ErrorState, LoadingBlock } from '@/components/ui/Feedback'
import { PatientSearchForm } from '@/features/clinical/PatientSearchForm'
import { useUhidInUrl } from '@/features/clinical/useUhidInUrl'
import { useLanguage } from '@/i18n/useLanguage'
import { ApiError } from '@/lib/api'
import { formatDate, formatNumber } from '@/lib/format'
import { parseIdentifier } from '@/lib/identifier'
import { toast } from '@/stores/toast'
import { labApi, labKeys } from './api'
import type { LabSearchResult, PrescribedTest } from './types'
import { UploadDialog } from './UploadDialog'

const FRESH_MS = 20_000

function PatientSummary({ patient }: { patient: LabSearchResult }) {
  const { t } = useTranslation()
  const gender =
    patient.gender === 'male' || patient.gender === 'female' || patient.gender === 'other' ? t(`clinical.${patient.gender}`) : null
  return (
    <div className="flex items-center gap-4">
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-teal/10 text-teal">
        <UserRound aria-hidden className="h-6 w-6" />
      </span>
      <div className="min-w-0">
        <h2 className="break-words text-lg font-black text-ink">{patient.fullName}</h2>
        <p className="flex flex-wrap gap-x-3 text-sm text-slate">
          <span className="whitespace-nowrap font-mono">{patient.uhid}</span>
          {gender && <span>{gender}</span>}
          <span className="whitespace-nowrap">
            {t('lab.upload.phone')}: <span className="font-mono">{patient.phone}</span>
          </span>
        </p>
      </div>
    </div>
  )
}

function TestRow({ test, fresh, onUpload }: { test: PrescribedTest; fresh: boolean; onUpload: () => void }) {
  const { t } = useTranslation()
  const lang = useLanguage()
  const pending = test.status === 'pending'
  const action = pending ? t('lab.upload.uploadAction') : t('lab.upload.uploadAgain')
  return (
    <li
      className={`flex flex-col gap-3 rounded-2xl border p-4 transition sm:flex-row sm:items-center ${
        fresh ? 'border-emerald-300 bg-emerald-50/60' : pending ? 'border-line bg-white' : 'border-line bg-surface-soft/60'
      }`}
    >
      <span
        className={`hidden h-10 w-10 shrink-0 items-center justify-center rounded-xl sm:flex ${
          pending ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'
        }`}
      >
        {pending ? <FlaskConical aria-hidden className="h-5 w-5" /> : <CircleCheck aria-hidden className="h-5 w-5" />}
      </span>
      <div className="min-w-0 flex-1">
        <p className="flex flex-wrap items-center gap-2">
          <span className="break-words text-[15px] font-bold text-ink">{test.name}</span>
          {pending ? (
            <Badge tone="warning">
              <Clock aria-hidden className="h-3 w-3" />
              {t('lab.upload.statusPending')}
            </Badge>
          ) : (
            <Badge tone="success">
              <CircleCheck aria-hidden className="h-3 w-3" />
              {fresh ? t('lab.upload.justNow') : t('lab.upload.statusUploaded')}
            </Badge>
          )}
        </p>
        <p className="mt-0.5 text-sm text-slate">{t('lab.upload.orderedOn', { date: formatDate(test.prescribedAt, lang) })}</p>
      </div>
      <Button
        variant={pending ? 'primary' : 'outline'}
        size="sm"
        onClick={onUpload}
        aria-label={t('lab.upload.actionFor', { action, test: test.name })}
      >
        <Upload aria-hidden className="h-4 w-4" />
        {action}
      </Button>
    </li>
  )
}

function OrderedTests({ patient }: { patient: LabSearchResult }) {
  const { t } = useTranslation()
  const lang = useLanguage()
  const queryClient = useQueryClient()
  const [uploading, setUploading] = useState<string | null>(null)
  const [fresh, setFresh] = useState<string | null>(null)
  const tests = patient.prescribedTests

  // "Uploaded just now" is true for a moment, not for the rest of the session.
  useEffect(() => {
    if (!fresh) return
    const timer = window.setTimeout(() => setFresh(null), FRESH_MS)
    return () => window.clearTimeout(timer)
  }, [fresh])
  const waiting = tests.filter((test) => test.status === 'pending').length

  if (tests.length === 0) {
    return (
      <EmptyState
        icon={<ClipboardList aria-hidden className="h-6 w-6" />}
        title={t('lab.upload.noTests')}
        description={t('lab.upload.noTestsBody')}
      />
    )
  }

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-base font-bold text-ink">{t('lab.upload.testsTitle')}</h3>
        <p className={`text-sm font-semibold ${waiting ? 'text-amber-700' : 'text-emerald-700'}`} role="status">
          {waiting ? t('lab.upload.waiting', { count: formatNumber(waiting, lang) }) : t('lab.upload.allDone')}
        </p>
      </div>
      <ul className="space-y-2.5">
        {tests.map((test) => (
          <TestRow key={test.name} test={test} fresh={fresh === test.name} onUpload={() => setUploading(test.name)} />
        ))}
      </ul>
      <UploadDialog
        // A fresh dialog per test, so nothing from a cancelled attempt carries over.
        key={uploading ?? 'closed'}
        patient={patient}
        testName={uploading}
        onClose={() => setUploading(null)}
        onUploaded={(testName) => {
          setUploading(null)
          setFresh(testName)
          toast.success(t('lab.upload.done', { test: testName, name: patient.fullName }))
          void queryClient.invalidateQueries({ queryKey: labKeys.search() })
          void queryClient.invalidateQueries({ queryKey: labKeys.allUploads() })
        }}
      />
    </div>
  )
}

/**
 * Find a patient → see the tests their doctor ordered → attach each report as a PDF.
 * The search term lives in the URL (?q=) so the home search hands off here.
 */
export function UploadReportPage() {
  const { t } = useTranslation()
  const [params, setParams] = useSearchParams()
  const q = params.get('q') ?? ''
  const query = parseIdentifier(q)

  const search = useQuery({
    queryKey: labKeys.search(q),
    queryFn: () => labApi.search(query!),
    select: (res) => res.data,
    enabled: query !== null,
    retry: false,
  })
  const patient = search.data
  useUhidInUrl(q, query, patient?.uhid, labKeys.search)
  const notFound = search.error instanceof ApiError && search.error.status === 404

  return (
    <>
      <PageHeader title={t('lab.upload.title')} description={t('lab.upload.subtitle')} />
      <Card padding="lg" className="mx-auto max-w-3xl">
        <PatientSearchForm
          key={q}
          initial={q}
          autoFocus={!q}
          busy={search.isFetching}
          onSearch={(value) => setParams({ q: value })}
        />

        {query && search.isPending && (
          <div className="mt-6">
            <LoadingBlock lines={4} />
          </div>
        )}
        {notFound && (
          <p role="alert" className="mt-6 rounded-xl bg-surface-soft px-4 py-3 text-sm font-semibold text-slate">
            {t('clinical.search.notFound')}
          </p>
        )}
        {search.isError && !notFound && (
          <div className="mt-6">
            <ErrorState error={search.error} onRetry={() => void search.refetch()} />
          </div>
        )}

        {patient && (
          <section aria-label={patient.fullName} className="mt-6 space-y-6 border-t border-line pt-6">
            <PatientSummary patient={patient} />
            <OrderedTests key={patient.patientId} patient={patient} />
          </section>
        )}
      </Card>
    </>
  )
}
