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

export interface AuthUser {
  id: string
  email: string
  phone: string
  role: Role
  status: UserStatus
  patient?: Record<string, unknown> | null
  doctor?: Record<string, unknown> | null
  lab?: Record<string, unknown> | null
  admin?: Record<string, unknown> | null
}

export interface AuthResult {
  user: AuthUser
  accessToken: string
  refreshToken: string
}
