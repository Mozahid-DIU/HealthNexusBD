import type { CoreMessages } from './en'
import type { PatientMessages } from './areas/patient'
import type { DoctorMessages } from './areas/doctor'

/**
 * Every translation key the app can use: the core bundle plus each lazily loaded area.
 * Type-only, so importing it never pulls area strings into the main bundle.
 */
export type Messages = CoreMessages & {
  patient: PatientMessages
  doctor: DoctorMessages
}

/** Areas whose strings are loaded on demand (see `loadArea`). */
export type Area = 'patient' | 'doctor'
