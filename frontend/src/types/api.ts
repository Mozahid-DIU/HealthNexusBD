export type Role = 'patient' | 'doctor' | 'lab' | 'admin'
export type UserStatus = 'active' | 'pending' | 'suspended'

/** The response envelope every backend endpoint returns. */
export interface ApiEnvelope<T> {
  success: boolean
  data: T
  error: string | null
  meta?: PaginationMeta
}

export interface PaginationMeta {
  total: number
  page: number
  limit: number
}

/** Role profiles as returned inside the user by /auth/login, /auth/register and /auth/me. */
export interface PatientProfile {
  id: string
  uhid: string
  fullName: string
  dateOfBirth?: string | null
  gender?: string | null
  bloodGroup?: string | null
  allergies?: string[]
  chronicDiseases?: string[]
}

export interface DoctorProfile {
  id: string
  bmdcNumber: string
  fullName: string
  specialization?: string | null
  isBmdcVerified?: boolean
}

export interface LabProfile {
  id: string
  licenseNumber: string
  centerName: string
  address?: string | null
  isApproved?: boolean
}

export interface AdminProfile {
  id: string
  fullName: string
  adminLevel?: string
}

export interface AuthUser {
  id: string
  email: string
  phone: string
  role: Role
  status: UserStatus
  patient?: PatientProfile | null
  doctor?: DoctorProfile | null
  lab?: LabProfile | null
  admin?: AdminProfile | null
}

export interface AuthResult {
  user: AuthUser
  accessToken: string
  refreshToken: string
}
