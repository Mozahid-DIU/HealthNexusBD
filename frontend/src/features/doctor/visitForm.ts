import { z } from 'zod'
import type { TranslationKey } from '@/i18n'
import { todayIso } from '@/lib/format'
import type { NewPrescription, NewRecord } from './types'

const msg = (key: TranslationKey) => ({ message: key })

const medication = z.object({
  name: z.string().max(120, msg('validation.tooLong')),
  dose: z.string().max(60, msg('validation.tooLong')),
  frequency: z.string().max(60, msg('validation.tooLong')),
  duration: z.string().max(60, msg('validation.tooLong')),
})

export type MedicationRow = z.infer<typeof medication>

export const emptyMedication = (): MedicationRow => ({ name: '', dose: '', frequency: '', duration: '' })

const isBlank = (m: MedicationRow) => !m.name.trim() && !m.dose.trim() && !m.frequency.trim() && !m.duration.trim()
const isComplete = (m: MedicationRow) => Boolean(m.name.trim() && m.dose.trim() && m.frequency.trim())

/** Mirrors backend createRecordSchema + prescriptionSchema (lengths, required fields). */
export const visitSchema = z.object({
  diagnosis: z.string().trim().min(2, msg('validation.required')).max(200, msg('validation.tooLong')),
  content: z.string().trim().min(2, msg('validation.required')).max(5000, msg('validation.tooLong')),
  symptoms: z.array(z.string()).max(30, msg('validation.tooLong')),
  followUpDate: z.string().refine((v) => v === '' || v >= todayIso(), msg('doctor.visit.futureOnly')),
  // A blank row is fine (ignored); a started row must have name, dose and frequency.
  medications: z.array(
    medication.superRefine((m, ctx) => {
      if (!isBlank(m) && !isComplete(m)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'doctor.visit.medIncomplete', path: ['name'] })
      }
    }),
  ),
  recommendedTests: z.array(z.string()).max(30, msg('validation.tooLong')),
  notes: z.string().max(500, msg('validation.tooLong')),
}).superRefine((v, ctx) => {
  // Advice is stored on the prescription; never drop it silently when there is none.
  const prescribed = v.medications.some((m) => !isBlank(m)) || v.recommendedTests.length > 0
  if (v.notes.trim() && !prescribed) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'doctor.visit.notesNeedRx', path: ['notes'] })
  }
})

export type VisitValues = z.infer<typeof visitSchema>

export const emptyVisit = (): VisitValues => ({
  diagnosis: '',
  content: '',
  symptoms: [],
  followUpDate: '',
  medications: [emptyMedication()],
  recommendedTests: [],
  notes: '',
})

/** The two API calls a visit becomes: the record, and a prescription only if anything was prescribed. */
export function toPayloads(patientId: string, v: VisitValues): { record: NewRecord; prescription: NewPrescription | null } {
  const record: NewRecord = {
    patientId,
    diagnosis: v.diagnosis.trim(),
    content: v.content.trim(),
    ...(v.symptoms.length ? { symptoms: v.symptoms } : {}),
    ...(v.followUpDate ? { followUpDate: v.followUpDate } : {}),
  }
  const medications = v.medications.filter((m) => !isBlank(m)).map((m) => ({
    name: m.name.trim(),
    dose: m.dose.trim(),
    frequency: m.frequency.trim(),
    ...(m.duration.trim() ? { duration: m.duration.trim() } : {}),
  }))
  const notes = v.notes.trim()
  const prescription: NewPrescription | null =
    medications.length || v.recommendedTests.length
      ? {
          medications,
          ...(v.recommendedTests.length ? { recommendedTests: v.recommendedTests } : {}),
          ...(notes ? { notes } : {}),
        }
      : null
  return { record, prescription }
}

/** Common dosing abbreviations offered as suggestions in the frequency field. */
export const FREQUENCIES = ['OD', 'BD', 'TDS', 'QID', 'HS', 'SOS', 'Stat'] as const
