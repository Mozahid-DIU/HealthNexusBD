import { useState } from 'react'
import { Controller, useFieldArray, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { CircleCheck, Plus, Sparkles, Trash2, TriangleAlert } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { FormError } from '@/components/ui/FormError'
import { Input } from '@/components/ui/Input'
import { TagInput } from '@/components/ui/TagInput'
import { Textarea } from '@/components/ui/Textarea'
import { AiSummaryCard } from '@/features/clinical/ClinicalViews'
import { asList } from '@/features/patient/text'
import { ApiError } from '@/lib/api'
import { todayIso } from '@/lib/format'
import { translateApiError } from '@/lib/errors'
import { toast } from '@/stores/toast'
import { doctorApi, doctorKeys } from './api'
import type { AiSummary, ClinicalProfile } from './types'
import { FREQUENCIES, emptyMedication, emptyVisit, toPayloads, visitSchema, type VisitValues } from './visitForm'

/** `prescriptionPending` holds the prescription still to save, with why it failed. */
type Saved = { recordId: string; prescriptionPending: VisitValues | null; prescriptionError: unknown }

const consentEnded = (error: unknown) => error instanceof ApiError && error.code === 'CONSENT_REQUIRED'

function SavedVisit({
  saved,
  patientId,
  onRetryRx,
  retrying,
  onNew,
}: {
  saved: Saved
  patientId: string
  onRetryRx: () => void
  retrying: boolean
  onNew: () => void
}) {
  const { t } = useTranslation()
  const [summary, setSummary] = useState<AiSummary | null>(null)
  const queryClient = useQueryClient()
  const ai = useMutation({
    mutationFn: () => doctorApi.aiSummary(saved.recordId),
    onSuccess: (res) => {
      setSummary(res.data)
      void queryClient.invalidateQueries({ queryKey: doctorKeys.patient(patientId) })
    },
    onError: (error) => toast.error(translateApiError(error, t)),
  })
  const noAlerts = summary && asList(summary.allergyAlerts).length === 0 && asList(summary.interactionAlerts).length === 0

  return (
    <div className="space-y-5">
      <div className="flex gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4" role="status">
        <CircleCheck aria-hidden className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
        <div>
          <p className="text-sm font-bold text-emerald-800">{t('doctor.visit.savedTitle')}</p>
          <p className="text-sm text-emerald-900">{t('doctor.visit.savedBody')}</p>
        </div>
      </div>

      {saved.prescriptionPending && (
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-red-200 bg-red-50 px-5 py-4" role="alert">
          <TriangleAlert aria-hidden className="h-5 w-5 shrink-0 text-red-600" />
          <div className="min-w-0 flex-1 text-sm text-red-800">
            <p>{t('doctor.visit.rxFailed')}</p>
            {saved.prescriptionError != null && <p className="mt-0.5 font-semibold">{translateApiError(saved.prescriptionError, t)}</p>}
          </div>
          <Button size="sm" onClick={onRetryRx} disabled={retrying}>
            {t('doctor.visit.retryRx')}
          </Button>
        </div>
      )}

      <div className="rounded-2xl border border-teal/30 bg-white p-5">
        <p className="flex items-center gap-2 text-base font-bold text-ink">
          <Sparkles aria-hidden className="h-4 w-4 text-teal" />
          {t('doctor.visit.aiTitle')}
        </p>
        {summary ? (
          <div className="mt-3">
            <AiSummaryCard summary={summary} />
            {noAlerts && <p className="mt-2 text-sm font-semibold text-emerald-700">{t('doctor.visit.aiNoAlerts')}</p>}
          </div>
        ) : (
          <>
            <p className="mt-1 text-sm text-slate">{t('doctor.visit.aiBody')}</p>
            <Button className="mt-4" onClick={() => ai.mutate()} disabled={ai.isPending || Boolean(saved.prescriptionPending)}>
              <Sparkles aria-hidden className="h-4 w-4" />
              {ai.isPending ? t('doctor.visit.aiGenerating') : t('doctor.visit.aiGenerate')}
            </Button>
          </>
        )}
      </div>

      <Button variant="outline" onClick={onNew}>
        {t('doctor.visit.newVisit')}
      </Button>
    </div>
  )
}

/**
 * Record a visit: diagnosis, note and symptoms, then an optional prescription, then an
 * AI check. If the record saves but the prescription fails, only the prescription is
 * retried — the visit is never duplicated.
 */
export function NewVisitForm({ profile }: { profile: ClinicalProfile }) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [saved, setSaved] = useState<Saved | null>(null)

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<VisitValues>({ resolver: zodResolver(visitSchema), defaultValues: emptyVisit() })
  const meds = useFieldArray({ control, name: 'medications' })

  const refreshChart = () => queryClient.invalidateQueries({ queryKey: doctorKeys.patient(profile.id) })

  const save = useMutation({
    mutationFn: async (values: VisitValues): Promise<Saved> => {
      const { record, prescription } = toPayloads(profile.id, values)
      const created = await doctorApi.createRecord(record)
      const done: Saved = { recordId: created.data.id, prescriptionPending: null, prescriptionError: null }
      if (!prescription) return done
      try {
        await doctorApi.addPrescription(created.data.id, prescription)
        return done
      } catch (error) {
        // The visit exists either way; keep the prescription (and the reason) for a retry.
        return { ...done, prescriptionPending: values, prescriptionError: error }
      }
    },
    onSuccess: (result) => {
      setSaved(result)
      void refreshChart()
    },
    // Consent ran out mid-visit: let the chart notice and lock itself.
    onError: (error) => {
      if (consentEnded(error)) void refreshChart()
    },
  })

  const retryRx = useMutation({
    mutationFn: async () => {
      const { prescription } = toPayloads(profile.id, saved!.prescriptionPending!)
      await doctorApi.addPrescription(saved!.recordId, prescription!)
    },
    onSuccess: () => {
      setSaved((s) => (s ? { ...s, prescriptionPending: null, prescriptionError: null } : s))
      void refreshChart()
    },
    onError: (error) => {
      setSaved((s) => (s ? { ...s, prescriptionError: error } : s))
      toast.error(translateApiError(error, t))
      if (consentEnded(error)) void refreshChart()
    },
  })

  if (saved) {
    return (
      <SavedVisit
        saved={saved}
        patientId={profile.id}
        onRetryRx={() => retryRx.mutate()}
        retrying={retryRx.isPending}
        onNew={() => {
          reset(emptyVisit())
          save.reset()
          setSaved(null)
        }}
      />
    )
  }

  const allergies = profile.allergies
  const medError = (i: number) => errors.medications?.[i]?.name?.message

  return (
    <form onSubmit={handleSubmit((v) => save.mutate(v))} noValidate className="space-y-6">
      {save.isError && <FormError error={save.error} />}

      <div className="grid gap-4">
        <Input
          label={t('doctor.visit.diagnosis')}
          placeholder={t('doctor.visit.diagnosisPlaceholder')}
          error={errors.diagnosis?.message}
          {...register('diagnosis')}
        />
        <Controller
          control={control}
          name="symptoms"
          render={({ field }) => (
            <TagInput
              label={t('doctor.visit.symptoms')}
              value={field.value}
              onChange={field.onChange}
              placeholder={t('doctor.visit.symptomsPlaceholder')}
              hint={t('doctor.visit.symptomsHint')}
              removeLabel={(tag) => t('doctor.visit.removeTag', { tag })}
            />
          )}
        />
        <Textarea
          label={t('doctor.visit.note')}
          placeholder={t('doctor.visit.notePlaceholder')}
          rows={5}
          error={errors.content?.message}
          {...register('content')}
        />
        <div className="sm:max-w-xs">
          <Input
            label={t('doctor.visit.followUp')}
            type="date"
            min={todayIso()}
            error={errors.followUpDate?.message}
            {...register('followUpDate')}
          />
        </div>
      </div>

      <fieldset className="space-y-4 rounded-2xl border border-line p-4 sm:p-5">
        <legend className="px-1 text-base font-bold text-ink">{t('doctor.visit.medsTitle')}</legend>
        <p className="text-sm text-slate">{t('doctor.visit.medsHint')}</p>
        {allergies.length > 0 && (
          <p className="flex items-center gap-2 rounded-xl bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
            <TriangleAlert aria-hidden className="h-4 w-4 shrink-0" />
            {t('doctor.visit.allergyReminder', { list: allergies.join(', ') })}
          </p>
        )}

        <datalist id="frequency-options">
          {FREQUENCIES.map((f) => (
            <option key={f} value={f} />
          ))}
        </datalist>

        <ul className="space-y-3">
          {meds.fields.map((field, i) => (
            <li key={field.id} className="rounded-xl bg-surface-soft p-3">
              <div className="grid gap-3 sm:grid-cols-[1.6fr_1fr_1fr_1fr_auto] sm:items-start">
                <Input
                  label={t('doctor.visit.medName')}
                  placeholder={t('doctor.visit.medNamePlaceholder')}
                  error={medError(i)}
                  {...register(`medications.${i}.name`)}
                />
                <Input
                  label={t('doctor.visit.medDose')}
                  placeholder={t('doctor.visit.medDosePlaceholder')}
                  {...register(`medications.${i}.dose`)}
                />
                <Input
                  label={t('doctor.visit.medFrequency')}
                  placeholder={t('doctor.visit.medFrequencyPlaceholder')}
                  list="frequency-options"
                  {...register(`medications.${i}.frequency`)}
                />
                <Input
                  label={t('doctor.visit.medDuration')}
                  placeholder={t('doctor.visit.medDurationPlaceholder')}
                  {...register(`medications.${i}.duration`)}
                />
                <button
                  type="button"
                  onClick={() => (meds.fields.length > 1 ? meds.remove(i) : meds.update(0, emptyMedication()))}
                  aria-label={t('doctor.visit.removeMed', { n: i + 1 })}
                  className="flex h-11 w-11 items-center justify-center self-end rounded-xl text-slate transition hover:bg-red-50 hover:text-red-600 focus-visible:outline-2 focus-visible:outline-brand"
                >
                  <Trash2 aria-hidden className="h-4 w-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>
        <Button variant="outline" size="sm" onClick={() => meds.append(emptyMedication())} disabled={meds.fields.length >= 30}>
          <Plus aria-hidden className="h-4 w-4" />
          {t('doctor.visit.addMed')}
        </Button>

        <Controller
          control={control}
          name="recommendedTests"
          render={({ field }) => (
            <TagInput
              label={t('doctor.visit.tests')}
              value={field.value}
              onChange={field.onChange}
              placeholder={t('doctor.visit.testsPlaceholder')}
              removeLabel={(tag) => t('doctor.visit.removeTag', { tag })}
              maxLength={120}
            />
          )}
        />
        <Textarea label={t('doctor.visit.rxNotes')} rows={2} error={errors.notes?.message} {...register('notes')} />
      </fieldset>

      <div className="flex justify-end">
        <Button type="submit" size="lg" disabled={save.isPending}>
          {save.isPending ? t('doctor.visit.saving') : t('doctor.visit.save')}
        </Button>
      </div>
    </form>
  )
}
