import { api } from '@/lib/api'
import type { Role } from '@/types/api'
import type {
  AccountStatus,
  AdminUser,
  AuditAction,
  AuditRow,
  Dashboard,
  DoctorApplication,
  LabApplication,
  RangeDays,
  Trends,
} from './types'

export const PAGE_SIZE = 12

export interface UserFilters {
  q?: string
  role?: Role
  status?: AccountStatus
  page: number
}

export interface AuditFilters {
  q?: string
  action?: AuditAction
  /** Leave one kind out (the dashboard feed hides sign-ins). */
  exclude?: AuditAction
  page: number
  limit?: number
}

/** Query keys, all under 'admin'; each caches the full API envelope (screens `select`). */
export const adminKeys = {
  all: ['admin'] as const,
  dashboard: () => ['admin', 'dashboard'] as const,
  trends: (days: RangeDays) => ['admin', 'trends', days] as const,
  applications: () => ['admin', 'applications'] as const,
  doctors: (status: AccountStatus, page: number) => ['admin', 'applications', 'doctors', status, page] as const,
  labs: (status: AccountStatus, page: number) => ['admin', 'applications', 'labs', status, page] as const,
  users: (filters?: UserFilters) => (filters ? (['admin', 'users', filters] as const) : (['admin', 'users'] as const)),
  audit: (filters?: AuditFilters) => (filters ? (['admin', 'audit', filters] as const) : (['admin', 'audit'] as const)),
}

/** Only the filters that are set, as a query string. */
function qs(params: Record<string, string | number | undefined>): string {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) if (value !== undefined && value !== '') search.set(key, String(value))
  return search.toString()
}

const id = (value: string) => encodeURIComponent(value)

export const adminApi = {
  dashboard: () => api.get<Dashboard>('/admin/dashboard'),
  trends: (days: RangeDays) => api.get<Trends>(`/admin/trends?${qs({ days })}`),

  doctors: (status: AccountStatus, page: number) =>
    api.get<DoctorApplication[]>(`/admin/doctors?${qs({ status, page, limit: PAGE_SIZE })}`),
  labs: (status: AccountStatus, page: number) => api.get<LabApplication[]>(`/admin/labs?${qs({ status, page, limit: PAGE_SIZE })}`),
  approveDoctor: (doctorId: string) => api.post<{ id: string }>(`/admin/doctors/${id(doctorId)}/approve`),
  rejectDoctor: (doctorId: string, reason: string) => api.post<{ id: string }>(`/admin/doctors/${id(doctorId)}/reject`, { reason }),
  approveLab: (labId: string) => api.post<{ id: string }>(`/admin/labs/${id(labId)}/approve`),
  rejectLab: (labId: string, reason: string) => api.post<{ id: string }>(`/admin/labs/${id(labId)}/reject`, { reason }),

  users: (f: UserFilters) => api.get<AdminUser[]>(`/admin/users?${qs({ q: f.q, role: f.role, status: f.status, page: f.page, limit: PAGE_SIZE })}`),
  setSuspended: (userId: string, suspend: boolean) =>
    api.post<{ id: string; status: AccountStatus }>(`/admin/users/${id(userId)}/suspend`, { suspend }),

  audit: (f: AuditFilters) =>
    api.get<AuditRow[]>(`/admin/audit?${qs({ q: f.q, action: f.action, exclude: f.exclude, page: f.page, limit: f.limit ?? PAGE_SIZE })}`),
}
