/** Shapes returned by the /patient and patient-side /consent endpoints. */

export interface PatientProfileDetail {
  id: string
  uhid: string
  nid: string
  fullName: string
  email: string
  phone: string
  dateOfBirth: string | null
  gender: string | null
  bloodGroup: string | null
  allergies: string[]
  chronicDiseases: string[]
  createdAt: string
}

export interface Medication {
  name: string
  dose: string
  frequency: string
  duration?: string
}

export interface Prescription {
  id: string
  medications: Medication[]
  recommendedTests: string[]
  notes: string | null
  createdAt: string
}

export interface SideEffectText {
  common: string[]
  serious: string[]
  advice: string
}

/** Patient-friendly notes on one prescribed medicine, in both languages. */
export interface SideEffect {
  drug: string
  /** `reviewed`: the built-in list; `ai`: written by Gemini and labelled as such. */
  source?: 'reviewed' | 'ai'
  en: SideEffectText
  bn: SideEffectText
}

export interface AiSummary {
  id: string
  summary: string
  interactionAlerts: string[]
  allergyAlerts: string[]
  /** Absent on summaries generated before side effects existed. */
  sideEffects?: SideEffect[]
  model: string
  generatedAt: string
}

export interface RecordAuthor {
  fullName: string
  specialization: string | null
}

export interface MedicalRecordSummary {
  id: string
  diagnosis: string | null
  content: string
  symptoms: string[]
  followUpDate: string | null
  createdAt: string
  doctor: RecordAuthor | null
  prescriptions: Prescription[]
}

export interface MedicalRecordDetail extends MedicalRecordSummary {
  aiSummaries: AiSummary[]
}

export interface LabReport {
  id: string
  testName: string
  fileUrl: string
  lab: string
  isVerified: boolean
  uploadedAt: string
}

export type AuditAction = 'view' | 'create' | 'update' | 'grant' | 'revoke' | 'login'

export interface AuditEntry {
  id: string
  action: AuditAction
  by: string
  role: 'patient' | 'doctor' | 'lab' | 'admin'
  resource: string | null
  at: string
}

export type NotificationType = 'lab_report' | 'follow_up'

export interface PatientNotification {
  id: string
  type: NotificationType
  /** English fallback text, used when `params` is empty (older notifications). */
  title: string
  body: string
  params: Record<string, string>
  readAt: string | null
  createdAt: string
}

export interface NotificationInbox {
  notifications: PatientNotification[]
  unreadCount: number
}

export interface ConsentDoctor {
  fullName: string
  specialization: string | null
  bmdcNumber: string
}

export interface PendingRequest {
  requestId: string
  doctor: ConsentDoctor
  reason: string | null
  requestedAt: string
  expiresAt: string
}

export interface ActiveSession {
  sessionId: string
  doctor: ConsentDoctor
  grantedAt: string
  expiresAt: string
}

export interface ConsentActivity {
  pendingRequests: PendingRequest[]
  activeSessions: ActiveSession[]
}

export interface ProfileUpdate {
  fullName?: string
  dateOfBirth?: string
  gender?: 'male' | 'female' | 'other'
  bloodGroup?: string
  allergies?: string[]
  chronicDiseases?: string[]
}

/** One turn of a Health Assistant chat (`model` is the assistant). */
export interface ChatTurn {
  role: 'user' | 'model'
  text: string
  /** The server's signature on its own answer; sent back with it as history. */
  sig?: string
}

/** One of the patient's own visits or lab reports, shared with the assistant to explain. */
export interface ChatAttachment {
  kind: 'record' | 'labReport'
  id: string
  title: string
}

/** POST /assistant/chat */
export interface ChatReply {
  reply: string
  sig: string
  /** The question may describe an emergency: show the 999 call-out first. */
  emergency: boolean
  /** The answer mentions doses or stopping a medicine: add an "ask your doctor" reminder. */
  medicineCaution: boolean
  model: string
  attachment: ChatAttachment | null
}
