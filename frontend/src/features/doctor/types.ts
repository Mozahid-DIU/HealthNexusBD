import type { AiSummary, LabReport, Prescription, RecordAuthor } from '@/features/patient/types'

export type { AiSummary, LabReport, Medication, Prescription } from '@/features/patient/types'

/** GET /doctor/patients/:id/ai-overview: an AI briefing on the whole history. */
export interface AiOverview {
  summary: string
  alerts: string[]
  model: string
  visitCount: number
  generatedAt: string
}

/** GET /doctor/search */
export interface SearchResult {
  patientId: string
  uhid: string
  fullName: string
  gender: string | null
  phone: string // masked, e.g. ********007
  hasActiveConsent: boolean
  consentExpiresAt: string | null
}

/** POST /consent/request */
export interface AccessRequest {
  requestId: string
  patient: { uhid: string; fullName: string }
  reason: string | null
  expiresAt: string
  otpMode: 'demo' | 'real'
  smsSent: boolean
  devOtp?: string
}

/** POST /consent/verify */
export interface AccessGrant {
  sessionId: string
  patient: { uhid: string; fullName: string }
  expiresAt: string
}

/** GET /doctor/patients (patients with live consent) */
export interface ConsentedPatient {
  id: string
  uhid: string
  fullName: string
  gender: string | null
  bloodGroup: string | null
  consentExpiresAt: string
}

/** GET /doctor/patients/:id */
export interface ClinicalProfile {
  id: string
  uhid: string
  fullName: string
  dateOfBirth: string | null
  gender: string | null
  bloodGroup: string | null
  allergies: string[]
  chronicDiseases: string[]
  consentExpiresAt: string
}

/** GET /doctor/patients/:id/records */
export interface ChartRecord {
  id: string
  diagnosis: string | null
  content: string
  symptoms: string[]
  isVerified: boolean
  followUpDate: string | null
  createdAt: string
  author: RecordAuthor | null
  prescriptions: Prescription[]
  aiSummaries: AiSummary[]
}

export interface DoctorLabReport extends LabReport {
  recordId: string | null
}

export interface NewRecord {
  patientId: string
  diagnosis: string
  content: string
  symptoms?: string[]
  followUpDate?: string
}

export interface NewPrescription {
  medications: Array<{ name: string; dose: string; frequency: string; duration?: string }>
  recommendedTests?: string[]
  notes?: string
}
