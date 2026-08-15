import { useState } from 'react'
import { useForm, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
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
  label: string
  placeholder: string
  type?: 'text' | 'password'
  hint?: string
}

const ROLES: { key: RegRole; label: string; blurb: string }[] = [
  { key: 'patient', label: 'Patient', blurb: 'Own and share your records' },
  { key: 'doctor', label: 'Doctor', blurb: 'BMDC-verified access' },
  { key: 'lab', label: 'Lab', blurb: 'Upload diagnostic reports' },
]

const FIELDS: Record<RegRole, FieldDef[]> = {
  patient: [
    { name: 'fullName', label: 'Full name', placeholder: 'e.g. Rahim Uddin' },
    { name: 'nid', label: 'National ID (NID)', placeholder: '10–17 digit NID' },
    { name: 'email', label: 'Email', placeholder: 'you@example.com' },
    { name: 'phone', label: 'Phone', placeholder: '017XXXXXXXX' },
    { name: 'password', label: 'Password', placeholder: 'At least 8 characters', type: 'password' },
  ],
  doctor: [
    { name: 'fullName', label: 'Full name', placeholder: 'e.g. Dr. Ayesha Karim' },
    { name: 'bmdcNumber', label: 'BMDC registration no.', placeholder: 'e.g. A-29871' },
    { name: 'specialization', label: 'Specialization (optional)', placeholder: 'e.g. Cardiologist' },
    { name: 'email', label: 'Email', placeholder: 'you@example.com' },
    { name: 'phone', label: 'Phone', placeholder: '017XXXXXXXX' },
    { name: 'password', label: 'Password', placeholder: 'At least 8 characters', type: 'password' },
  ],
  lab: [
    { name: 'centerName', label: 'Diagnostic center name', placeholder: 'e.g. PathCare Diagnostics' },
    { name: 'licenseNumber', label: 'DGHS license no.', placeholder: 'e.g. DGHS-LAB-0099' },
    { name: 'address', label: 'Address (optional)', placeholder: 'e.g. Dhanmondi, Dhaka' },
    { name: 'email', label: 'Email', placeholder: 'lab@example.com' },
    { name: 'phone', label: 'Phone', placeholder: '017XXXXXXXX' },
    { name: 'password', label: 'Password', placeholder: 'At least 8 characters', type: 'password' },
  ],
}

const SCHEMA = { patient: patientSchema, doctor: doctorSchema, lab: labSchema }

function RoleTabs({ role, onChange }: { role: RegRole; onChange: (r: RegRole) => void }) {
  return (
    <div className="mb-6 grid grid-cols-3 gap-2 rounded-2xl bg-white p-1.5 shadow-card">
      {ROLES.map((r) => {
        const active = r.key === role
        return (
          <button
            key={r.key}
            type="button"
            onClick={() => onChange(r.key)}
            className={`rounded-xl px-2 py-2.5 text-center transition ${
              active ? 'bg-brand text-white shadow-brand' : 'text-slate hover:bg-brand/[0.05]'
            }`}
          >
            <span className="block text-sm font-bold">{r.label}</span>
          </button>
        )
      })}
    </div>
  )
}

/** Self-contained per-role form (remounts when the role changes to reset + swap schema). */
function RegisterForm({ role }: { role: RegRole }) {
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
            label={f.label}
            placeholder={f.placeholder}
            autoComplete="new-password"
            error={errors[f.name]?.message}
            {...register(f.name)}
          />
        ) : (
          <Input
            key={f.name}
            label={f.label}
            placeholder={f.placeholder}
            error={errors[f.name]?.message}
            {...register(f.name)}
          />
        ),
      )}

      <Button type="submit" size="lg" className="w-full" disabled={mutation.isPending}>
        {mutation.isPending ? 'Creating account…' : 'Create account'}
      </Button>

      {role !== 'patient' && (
        <p className="text-center text-xs text-slate">
          {role === 'doctor' ? 'Doctor' : 'Lab'} accounts are activated after admin verification.
        </p>
      )}
    </form>
  )
}

export function RegisterPage() {
  const [role, setRole] = useState<RegRole>('patient')

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Choose your role to get started."
      footer={
        <>
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-brand hover:underline">
            Log in
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
