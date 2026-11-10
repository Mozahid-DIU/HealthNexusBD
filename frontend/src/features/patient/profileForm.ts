import { z } from 'zod'
import type { TranslationKey } from '@/i18n'
import { todayIso } from '@/lib/format'
import type { PatientProfileDetail, ProfileUpdate } from './types'

const msg = (key: TranslationKey) => ({ message: key })

export const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] as const
export const GENDERS = ['male', 'female', 'other'] as const

/** "Penicillin, peanuts ,penicillin" → ["Penicillin", "peanuts"] (trimmed, de-duplicated). */
export function parseList(text: string): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const part of text.split(/[,\n]/)) {
    const item = part.trim()
    const key = item.toLocaleLowerCase()
    if (item && !seen.has(key)) {
      seen.add(key)
      out.push(item)
    }
  }
  return out
}

/** Mirrors backend/src/modules/patient/patient.schema.ts (lengths and enums). */
export const profileSchema = z.object({
  fullName: z.string().trim().min(2, msg('validation.required')).max(120, msg('validation.tooLong')),
  dateOfBirth: z
    .string()
    .refine((v) => v === '' || /^\d{4}-\d{2}-\d{2}$/.test(v), msg('validation.required'))
    .refine((v) => v === '' || v <= todayIso(), msg('patient.profile.futureDate')),
  gender: z.enum(['', ...GENDERS]),
  bloodGroup: z.enum(['', ...BLOOD_GROUPS]),
  allergies: z
    .string()
    .refine((v) => parseList(v).every((i) => i.length <= 60) && parseList(v).length <= 50, msg('validation.tooLong')),
  chronicDiseases: z
    .string()
    .refine((v) => parseList(v).every((i) => i.length <= 60) && parseList(v).length <= 50, msg('validation.tooLong')),
})

export type ProfileValues = z.infer<typeof profileSchema>

export function toFormValues(p: PatientProfileDetail): ProfileValues {
  const gender = GENDERS.find((g) => g === p.gender) ?? ''
  const bloodGroup = BLOOD_GROUPS.find((b) => b === p.bloodGroup) ?? ''
  return {
    fullName: p.fullName,
    dateOfBirth: p.dateOfBirth ? p.dateOfBirth.slice(0, 10) : '',
    gender,
    bloodGroup,
    allergies: (p.allergies ?? []).join(', '),
    chronicDiseases: (p.chronicDiseases ?? []).join(', '),
  }
}

const sameList = (a: string[], b: string[]) => a.length === b.length && a.every((x, i) => x === b[i])

/**
 * Only the fields that actually changed. Blank selects/dates are not sent: the API has
 * no "unset", and sending nothing keeps the saved value.
 */
export function changedFields(original: PatientProfileDetail, v: ProfileValues): ProfileUpdate {
  const out: ProfileUpdate = {}
  const before = toFormValues(original)
  if (v.fullName.trim() !== original.fullName) out.fullName = v.fullName.trim()
  if (v.dateOfBirth && v.dateOfBirth !== before.dateOfBirth) out.dateOfBirth = v.dateOfBirth
  if (v.gender && v.gender !== before.gender) out.gender = v.gender
  if (v.bloodGroup && v.bloodGroup !== before.bloodGroup) out.bloodGroup = v.bloodGroup
  const allergies = parseList(v.allergies)
  if (!sameList(allergies, original.allergies ?? [])) out.allergies = allergies
  const chronic = parseList(v.chronicDiseases)
  if (!sameList(chronic, original.chronicDiseases ?? [])) out.chronicDiseases = chronic
  return out
}
