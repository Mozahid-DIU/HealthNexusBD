import { api } from '@/lib/api'
import type {
  AccessGrant,
  AccessRequest,
  AiSummary,
  ChartRecord,
  ClinicalProfile,
  ConsentedPatient,
  DoctorLabReport,
  NewPrescription,
  NewRecord,
  SearchResult,
} from './types'

export const PAGE_SIZE = 10

/**
 * Query keys, all under 'doctor'. Like the patient keys, each caches the full API
 * envelope; screens use `select` for the inner data.
 */
export const doctorKeys = {
  all: ['doctor'] as const,
  patients: () => ['doctor', 'patients'] as const,
  patient: (id: string) => ['doctor', 'patient', id] as const,
  profile: (id: string) => ['doctor', 'patient', id, 'profile'] as const,
  records: (id: string, page: number) => ['doctor', 'patient', id, 'records', page] as const,
  labs: (id: string, page: number) => ['doctor', 'patient', id, 'labs', page] as const,
}

const q = (params: Record<string, string>) => new URLSearchParams(params).toString()
const id = (value: string) => encodeURIComponent(value)

export const doctorApi = {
  search: (query: { uhid: string } | { phone: string }) => api.get<SearchResult>(`/doctor/search?${q(query)}`),
  requestAccess: (body: { uhid: string; reason?: string }) => api.post<AccessRequest>('/consent/request', body),
  verifyAccess: (body: { requestId: string; code: string }) => api.post<AccessGrant>('/consent/verify', body),

  patients: () => api.get<ConsentedPatient[]>('/doctor/patients'),
  profile: (patientId: string) => api.get<ClinicalProfile>(`/doctor/patients/${id(patientId)}`),
  records: (patientId: string, page: number) =>
    api.get<ChartRecord[]>(`/doctor/patients/${id(patientId)}/records?${q({ page: String(page), limit: String(PAGE_SIZE) })}`),
  labReports: (patientId: string, page: number) =>
    api.get<DoctorLabReport[]>(`/doctor/patients/${id(patientId)}/lab-reports?${q({ page: String(page), limit: String(PAGE_SIZE) })}`),
  labReportFile: (patientId: string, reportId: string) =>
    api.blob(`/doctor/patients/${id(patientId)}/lab-reports/${id(reportId)}/file`),

  createRecord: (body: NewRecord) => api.post<{ id: string; diagnosis: string; createdAt: string }>('/doctor/records', body),
  addPrescription: (recordId: string, body: NewPrescription) =>
    api.post<{ id: string; recordId: string; createdAt: string }>(`/doctor/records/${id(recordId)}/prescription`, body),
  aiSummary: (recordId: string) => api.post<AiSummary>(`/doctor/records/${id(recordId)}/ai-summary`),
}
