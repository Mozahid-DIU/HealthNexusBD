import type { CoreMessages } from './en'
import type { PatientMessages } from './areas/patient'
import type { DoctorMessages } from './areas/doctor'
import type { LabMessages } from './areas/lab'
import type { AdminMessages } from './areas/admin'
import type { LandingMessages } from './areas/landing'

/**
 * Every translation key the app can use: the core bundle plus each lazily loaded area.
 * Type-only, so importing it never pulls area strings into the main bundle.
 */
export type Messages = CoreMessages & {
  patient: PatientMessages
  doctor: DoctorMessages
  lab: LabMessages
  admin: AdminMessages
  landing: LandingMessages
}

/** Areas whose strings are loaded on demand (see `loadArea`). */
export type Area = 'patient' | 'doctor' | 'lab' | 'admin' | 'landing'
