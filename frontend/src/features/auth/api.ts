import { api } from '@/lib/api'
import type { AuthResult, AuthUser } from '@/types/api'

/** React Query key for the live /auth/me profile. */
export const meQueryKey = ['auth', 'me'] as const

export const authApi = {
  login: (body: { identifier: string; password: string }) =>
    api.post<AuthResult>('/auth/login', body),

  register: (body: Record<string, unknown>) => api.post<AuthResult>('/auth/register', body),

  me: () => api.get<AuthUser>('/auth/me'),

  forgotPassword: (email: string) =>
    api.post<{ message: string; devOtp?: string }>('/auth/forgot-password', { email }),

  resetPassword: (body: { email: string; code: string; newPassword: string }) =>
    api.post<{ message: string }>('/auth/reset-password', body),
}
