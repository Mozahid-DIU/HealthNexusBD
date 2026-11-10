import { api } from '@/lib/api'
import type {
  AuditEntry,
  ConsentActivity,
  LabReport,
  MedicalRecordDetail,
  MedicalRecordSummary,
  NotificationInbox,
  PatientProfileDetail,
  ProfileUpdate,
} from './types'

export const PAGE_SIZE = 10

/**
 * Query keys, all under 'patient'. Each key always caches the full API envelope
 * ({ data, meta }) from the matching `patientApi` call — never a reshaped value — so
 * screens that share a key (overview, bell, inbox) can't see each other's shapes.
 */
export const patientKeys = {
  all: ['patient'] as const,
  profile: () => ['patient', 'profile'] as const,
  records: (page: number, limit = PAGE_SIZE) => ['patient', 'records', page, limit] as const,
  record: (id: string) => ['patient', 'record', id] as const,
  labReports: (page: number, limit = PAGE_SIZE) => ['patient', 'lab-reports', page, limit] as const,
  audit: (page: number) => ['patient', 'audit', page] as const,
  notifications: (page: number, limit = PAGE_SIZE) => ['patient', 'notifications', page, limit] as const,
  notificationsAll: () => ['patient', 'notifications'] as const,
  consent: () => ['patient', 'consent'] as const,
}

const page = (p: number, limit = PAGE_SIZE) => `page=${p}&limit=${limit}`

export const patientApi = {
  profile: () => api.get<PatientProfileDetail>('/patient/profile'),
  updateProfile: (body: ProfileUpdate) => api.patch<Partial<PatientProfileDetail>>('/patient/profile', body),

  records: (p: number, limit = PAGE_SIZE) => api.get<MedicalRecordSummary[]>(`/patient/records?${page(p, limit)}`),
  record: (id: string) => api.get<MedicalRecordDetail>(`/patient/records/${encodeURIComponent(id)}`),

  labReports: (p: number, limit = PAGE_SIZE) => api.get<LabReport[]>(`/patient/lab-reports?${page(p, limit)}`),
  /** The decrypted PDF. `fileUrl` from the list is "/api/…"; the client base already ends in /api. */
  labReportFile: (report: Pick<LabReport, 'id'>) =>
    api.blob(`/patient/lab-reports/${encodeURIComponent(report.id)}/file`),

  audit: (p: number) => api.get<AuditEntry[]>(`/patient/audit?${page(p)}`),

  notifications: (p: number, limit = PAGE_SIZE) =>
    api.get<NotificationInbox>(`/patient/notifications?${page(p, limit)}`),
  markRead: (id: string) => api.post<{ id: string }>(`/patient/notifications/${encodeURIComponent(id)}/read`),
  markAllRead: () => api.post<{ updated: number }>('/patient/notifications/read-all'),

  consent: () => api.get<ConsentActivity>('/consent/requests'),
  denyRequest: (requestId: string) =>
    api.post<{ requestId: string }>(`/consent/requests/${encodeURIComponent(requestId)}/deny`),
  revokeSession: (sessionId: string) =>
    api.post<{ sessionId: string }>(`/consent/sessions/${encodeURIComponent(sessionId)}/revoke`),
}
