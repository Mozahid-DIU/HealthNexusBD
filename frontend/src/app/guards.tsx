import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth'
import { fromState, routeForUser } from '@/features/auth/redirect'
import type { Role } from '@/types/api'

/** The signed-in user, or null. A user without a token is treated as signed out. */
function useSessionUser() {
  return useAuthStore((s) => (s.accessToken && s.user ? s.user : null))
}

/**
 * Only `role` may enter. Signed-out visitors go to /login (remembering where they were
 * going); signed-in users of another role go to their own home.
 */
export function RequireRole({ role }: { role: Role }) {
  const user = useSessionUser()
  const location = useLocation()
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />
  }
  if (user.role !== role) return <Navigate to={routeForUser(user)} replace />
  return <Outlet />
}

/** Login/register pages: a signed-in user is sent straight to their dashboard. */
export function GuestOnly() {
  const user = useSessionUser()
  const location = useLocation()
  if (user) return <Navigate to={routeForUser(user, fromState(location.state))} replace />
  return <Outlet />
}

/** Legacy `/app` link → the right dashboard, or login. */
export function RoleHomeRedirect() {
  const user = useSessionUser()
  return <Navigate to={user ? routeForUser(user) : '/login'} replace />
}
