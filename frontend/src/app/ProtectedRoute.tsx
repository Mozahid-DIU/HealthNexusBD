import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth'

/** Guards a route: redirects to /login when there is no active session. */
export function ProtectedRoute({ children }: { children: ReactNode }) {
  const isAuthed = useAuthStore((s) => Boolean(s.accessToken && s.user))
  if (!isAuthed) return <Navigate to="/login" replace />
  return <>{children}</>
}
