import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { ROLE_LOGIN } from '@/app/navigation'
import { api } from '@/lib/api'
import { useAuthStore } from '@/stores/auth'

/**
 * Sign out: revoke the session on the server, then always clear locally — even if the
 * request fails (offline, already expired), the user must end up signed out. Each role
 * lands back on its own sign-in page (admins on the console entrance).
 */
export function useLogout() {
  const navigate = useNavigate()
  const clear = useAuthStore((s) => s.clear)
  return useMutation({
    mutationFn: () => api.post('/auth/logout'),
    onSettled: () => {
      const role = useAuthStore.getState().user?.role
      clear()
      navigate(role ? ROLE_LOGIN[role] : '/login', { replace: true })
    },
  })
}
