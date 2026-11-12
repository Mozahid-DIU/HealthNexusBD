import type { Role } from '@/types/api'

/** GET /admin/dashboard: live totals. */
export interface Dashboard {
  users: { patients: number; doctors: number; labs: number; total: number }
  pending: { doctors: number; labs: number }
  suspended: number
  activeSessions: number
  clinical: { records: number; labReports: number }
}

export type Metric = 'patients' | 'doctors' | 'labs' | 'records' | 'labReports' | 'consents'
export type TrendPoint = { date: string } & Record<Metric, number>
export type RangeDays = 7 | 30 | 90

/** GET /admin/trends?days=… : one point per Dhaka day, plus this vs previous period. */
export interface Trends {
  days: number
  series: TrendPoint[]
  totals: { current: Record<Metric, number>; previous: Record<Metric, number> }
}

export type AccountStatus = 'active' | 'pending' | 'suspended'

export interface AccountSummary {
  id: string
  email: string
  phone: string
  status: AccountStatus
  createdAt: string
}

export interface DoctorApplication {
  id: string
  fullName: string
  bmdcNumber: string
  specialization: string | null
  isBmdcVerified: boolean
  approvedAt: string | null
  account: AccountSummary
  /** The council's own record for this BMDC number, if any. */
  registry: { fullName: string; specialization: string | null } | null
}

export interface LabApplication {
  id: string
  centerName: string
  licenseNumber: string
  address: string | null
  isApproved: boolean
  account: AccountSummary
  registry: { centerName: string; address: string | null } | null
}

export interface AdminUser {
  id: string
  email: string
  phone: string
  role: Role
  status: AccountStatus
  createdAt: string
  patient: { fullName: string; uhid: string } | null
  doctor: { fullName: string; bmdcNumber: string; isBmdcVerified?: boolean } | null
  lab: { centerName: string; licenseNumber: string; isApproved?: boolean } | null
  admin: { fullName: string; adminLevel?: string | null } | null
}

export type AuditAction = 'view' | 'create' | 'update' | 'grant' | 'revoke' | 'login'

export interface AuditRow {
  id: string
  action: AuditAction
  resource: string | null
  ipAddress: string | null
  createdAt: string
  actor: { email: string; role: Role }
  patient: { uhid: string; fullName: string } | null
}
