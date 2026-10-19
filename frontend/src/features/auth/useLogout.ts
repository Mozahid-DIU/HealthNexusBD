import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { api } from '@/lib/api'
import { useAuthStore } from '@/stores/auth'

/**
 * Sign out: revoke the session on the server, then always clear locally — even if the
 * request fails (offline, already expired), the user must end up signed out.
 */
export function useLogout() {
  const navigate = useNavigate()
  const clear = useAuthStore((s) => s.clear)
  return useMutation({
    mutationFn: () => api.post('/auth/logout'),
    onSettled: () => {
      clear()
      navigate('/login', { replace: true })
    },
  })
}
