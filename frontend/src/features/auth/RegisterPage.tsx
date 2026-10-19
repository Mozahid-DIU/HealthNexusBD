import { useState } from 'react'
import { useForm, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import type { TranslationKey } from '@/i18n'
import { AuthLayout } from './AuthLayout'
import { patientSchema, doctorSchema, labSchema } from './schemas'
import { authApi } from './api'
import { routeForUser } from './redirect'
import { useAuthStore } from '@/stores/auth'
import type { Role } from '@/types/api'
import { Input } from '@/components/ui/Input'
import { PasswordInput } from '@/components/ui/PasswordInput'
import { Button } from '@/components/ui/Button'
import { FormError } from '@/components/ui/FormError'

type RegRole = Exclude<Role, 'admin'>
type Values = Record<string, string>

interface FieldDef {
  name: string
  label: TranslationKey
  placeholder: TranslationKey
  type?: 'text' | 'password'
  autoComplete?: string
}

const ROLES: { key: RegRole; label: TranslationKey; blurb: TranslationKey }[] = [
  { key: 'patient', label: 'roles.patient', blurb: 'auth.register.patientBlurb' },
  { key: 'doctor', label: 'roles.doctor', blurb: 'auth.register.doctorBlurb' },
  { key: 'lab', label: 'roles.lab', blurb: 'auth.register.labBlurb' },
]

const EMAIL: FieldDef = {
  name: 'email',
  label: 'auth.register.email',
  placeholder: 'auth.register.emailPlaceholder',
  autoComplete: 'email',
}
const PHONE: FieldDef = {
  name: 'phone',
  label: 'auth.register.phone',
  placeholder: 'auth.register.phonePlaceholder',
  autoComplete: 'tel',
}
const PASSWORD: FieldDef = {
  name: 'password',
  label: 'auth.register.password',
  placeholder: 'auth.register.passwordPlaceholder',
  type: 'password',
}

const FIELDS: Record<RegRole, FieldDef[]> = {
  patient: [
    {
      name: 'fullName',
      label: 'auth.register.fullName',
      placeholder: 'auth.register.fullNamePatientPlaceholder',
      autoComplete: 'name',
    },
    { name: 'nid', label: 'auth.register.nid', placeholder: 'auth.register.nidPlaceholder' },
    EMAIL,
    PHONE,
    PASSWORD,
  ],
  doctor: [
    {
      name: 'fullName',
      label: 'auth.register.fullName',
      placeholder: 'auth.register.fullNameDoctorPlaceholder',
      autoComplete: 'name',
    },
    { name: 'bmdcNumber', label: 'auth.register.bmdc', placeholder: 'auth.register.bmdcPlaceholder' },
    {
      name: 'specialization',
      label: 'auth.register.specialization',
      placeholder: 'auth.register.specializationPlaceholder',
    },
    EMAIL,
    PHONE,
    PASSWORD,
  ],
  lab: [
    {
      name: 'centerName',
      label: 'auth.register.centerName',
      placeholder: 'auth.register.centerNamePlaceholder',
      autoComplete: 'organization',
    },
    { name: 'licenseNumber', label: 'auth.register.license', placeholder: 'auth.register.licensePlaceholder' },
    {
      name: 'address',
      label: 'auth.register.address',
      placeholder: 'auth.register.addressPlaceholder',
      autoComplete: 'street-address',
    },
    { ...EMAIL, placeholder: 'auth.register.labEmailPlaceholder' },
    PHONE,
    PASSWORD,
  ],
}

const SCHEMA = { patient: patientSchema, doctor: doctorSchema, lab: labSchema }

function RoleTabs({ role, onChange }: { role: RegRole; onChange: (r: RegRole) => void }) {
  const { t } = useTranslation()
  return (
    <div
      role="group"
      aria-label={t('auth.register.roleTabs')}
      className="mb-6 grid grid-cols-3 gap-2 rounded-2xl bg-white p-1.5 shadow-card"
    >
      {ROLES.map((r) => {
        const active = r.key === role
        return (
          <button
            key={r.key}
            type="button"
            aria-pressed={active}
            title={t(r.blurb)}
            onClick={() => onChange(r.key)}
            className={`rounded-xl px-2 py-2.5 text-center transition ${
              active ? 'bg-brand text-white shadow-brand' : 'text-slate hover:bg-brand/[0.05]'
            }`}
          >
            <span className="block text-sm font-bold">{t(r.label)}</span>
          </button>
        )
      })}
    </div>
  )
}

/** Self-contained per-role form (remounts when the role changes to reset + swap schema). */
function RegisterForm({ role }: { role: RegRole }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const setAuth = useAuthStore((s) => s.setAuth)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Values>({ resolver: zodResolver(SCHEMA[role]) as unknown as Resolver<Values> })

  const mutation = useMutation({
    mutationFn: (values: Values) => {
      // Drop empty optional fields so the backend gets a clean payload.
      const clean = Object.fromEntries(Object.entries(values).filter(([, v]) => v !== ''))
      return authApi.register({ role, ...clean })
    },
    onSuccess: ({ data }) => {
      setAuth(data.user, data.accessToken, data.refreshToken)
      navigate(routeForUser(data.user), { replace: true })
    },
  })

  return (
    <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="space-y-4" noValidate>
      {mutation.isError && <FormError error={mutation.error} />}

      {FIELDS[role].map((f) =>
        f.type === 'password' ? (
          <PasswordInput
            key={f.name}
            label={t(f.label)}
            placeholder={t(f.placeholder)}
            autoComplete="new-password"
            error={errors[f.name]?.message}
            {...register(f.name)}
          />
        ) : (
          <Input
            key={f.name}
            label={t(f.label)}
            placeholder={t(f.placeholder)}
            autoComplete={f.autoComplete}
            error={errors[f.name]?.message}
            {...register(f.name)}
          />
        ),
      )}

      <Button type="submit" size="lg" className="w-full" disabled={mutation.isPending}>
        {mutation.isPending ? t('auth.register.submitting') : t('auth.register.submit')}
      </Button>

      {role !== 'patient' && (
        <p className="text-center text-xs text-slate">
          {role === 'doctor'
            ? t('auth.register.doctorVerificationNote')
            : t('auth.register.labVerificationNote')}
        </p>
      )}
    </form>
  )
}

export function RegisterPage() {
  const { t } = useTranslation()
  const [role, setRole] = useState<RegRole>('patient')

  return (
    <AuthLayout
      title={t('auth.register.title')}
      subtitle={t('auth.register.subtitle')}
      footer={
        <>
          {t('auth.register.haveAccount')}{' '}
          <Link to="/login" className="font-semibold text-brand hover:underline">
            {t('auth.register.logIn')}
          </Link>
        </>
      }
    >
      <RoleTabs role={role} onChange={setRole} />
      {/* key remounts the form so fields + validation reset on role change */}
      <RegisterForm key={role} role={role} />
    </AuthLayout>
  )
}
