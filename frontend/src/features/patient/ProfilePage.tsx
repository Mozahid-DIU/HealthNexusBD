import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { PageHeader } from '@/components/layout/dashboard/PageHeader'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader } from '@/components/ui/Card'
import { ErrorState, LoadingBlock } from '@/components/ui/Feedback'
import { FormError } from '@/components/ui/FormError'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { authApi } from '@/features/auth/api'
import { todayIso } from '@/lib/format'
import { useAuthStore } from '@/stores/auth'
import { toast } from '@/stores/toast'
import { patientApi, patientKeys } from './api'
import { BLOOD_GROUPS, GENDERS, changedFields, profileSchema, toFormValues, type ProfileValues } from './profileForm'
import type { PatientProfileDetail } from './types'

function ReadOnly({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="mb-1.5 text-[13px] font-semibold text-body">{label}</dt>
      <dd className="break-all rounded-xl border border-line bg-surface-soft px-4 py-3 font-mono text-sm text-ink">{value}</dd>
    </div>
  )
}

function ProfileForm({ profile }: { profile: PatientProfileDetail }) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const setUser = useAuthStore((s) => s.setUser)
  const today = todayIso()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<ProfileValues>({ resolver: zodResolver(profileSchema), defaultValues: toFormValues(profile) })

  // When fresh data arrives (after saving), show it as the new baseline.
  useEffect(() => {
    reset(toFormValues(profile))
  }, [profile, reset])

  const save = useMutation({
    mutationFn: async (values: ProfileValues) => {
      const changes = changedFields(profile, values)
      if (Object.keys(changes).length === 0) return false
      await patientApi.updateProfile(changes)
      return true
    },
    onSuccess: async (saved) => {
      if (!saved) {
        // e.g. a cleared date or select: the API has no "unset", so show the saved value again.
        reset(toFormValues(profile))
        toast.info(t('patient.profile.noChanges'))
        return
      }
      toast.success(t('patient.profile.saved'))
      await queryClient.invalidateQueries({ queryKey: patientKeys.profile() })
      // Name and blood group also show in the sidebar and the ID card.
      try {
        setUser((await authApi.me()).data)
      } catch {
        // Not critical: the next /auth/me refresh will catch up.
      }
    },
  })

  return (
    <form onSubmit={handleSubmit((v) => save.mutate(v))} noValidate className="space-y-6">
      <Card as="section" aria-labelledby="identity-heading">
        <CardHeader id="identity-heading" title={t('patient.profile.identity')} />
        <dl className="grid gap-4 sm:grid-cols-2">
          <ReadOnly label={t('patient.profile.uhid')} value={profile.uhid} />
          <ReadOnly label={t('patient.profile.nid')} value={profile.nid} />
          <ReadOnly label={t('patient.profile.email')} value={profile.email} />
          <ReadOnly label={t('patient.profile.phone')} value={profile.phone} />
        </dl>
      </Card>

      <Card as="section" aria-labelledby="health-heading">
        <CardHeader id="health-heading" title={t('patient.profile.health')} />
        {save.isError && (
          <div className="mb-4">
            <FormError error={save.error} />
          </div>
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Input label={t('patient.profile.fullName')} autoComplete="name" error={errors.fullName?.message} {...register('fullName')} />
          </div>
          <Input
            label={t('patient.profile.dateOfBirth')}
            type="date"
            max={today}
            error={errors.dateOfBirth?.message}
            {...register('dateOfBirth')}
          />
          <Select
            label={t('patient.profile.gender')}
            placeholder={profile.gender ? undefined : t('patient.profile.notSet')}
            options={GENDERS.map((g) => ({ value: g, label: t(`patient.profile.${g}`) }))}
            error={errors.gender?.message}
            {...register('gender')}
          />
          <Select
            label={t('patient.profile.bloodGroup')}
            placeholder={profile.bloodGroup ? undefined : t('patient.profile.notSet')}
            options={BLOOD_GROUPS.map((b) => ({ value: b, label: b }))}
            error={errors.bloodGroup?.message}
            {...register('bloodGroup')}
          />
          <div className="sm:col-span-2">
            <Input
              label={t('patient.profile.allergies')}
              hint={t('patient.profile.allergiesHint')}
              error={errors.allergies?.message}
              {...register('allergies')}
            />
          </div>
          <div className="sm:col-span-2">
            <Input
              label={t('patient.profile.chronic')}
              hint={t('patient.profile.chronicHint')}
              error={errors.chronicDiseases?.message}
              {...register('chronicDiseases')}
            />
          </div>
        </div>
        <div className="mt-6 flex justify-end">
          <Button type="submit" disabled={save.isPending || !isDirty}>
            {save.isPending ? t('patient.profile.saving') : t('patient.profile.save')}
          </Button>
        </div>
      </Card>
    </form>
  )
}

export function ProfilePage() {
  const { t } = useTranslation()
  const profile = useQuery({
    queryKey: patientKeys.profile(),
    queryFn: () => patientApi.profile(),
    select: (res) => res.data,
  })

  return (
    <>
      <PageHeader title={t('patient.profile.title')} description={t('patient.profile.subtitle')} />
      {profile.isPending ? (
        <Card>
          <LoadingBlock lines={6} />
        </Card>
      ) : profile.isError ? (
        <Card>
          <ErrorState error={profile.error} onRetry={() => void profile.refetch()} />
        </Card>
      ) : (
        <ProfileForm profile={profile.data} />
      )}
    </>
  )
}
