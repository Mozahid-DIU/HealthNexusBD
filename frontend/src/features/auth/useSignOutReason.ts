import { useEffect, useState } from 'react'
import { useAuthStore } from '@/stores/auth'
import type { SignOutReason } from '@/stores/auth'

/**
 * Why the visitor was just signed out (expired session, suspension), if they were.
 * Read once and kept for this visit; cleared in an effect so StrictMode's double render
 * can't lose it.
 */
export function useSignOutReason(): SignOutReason | null {
  const clearSignOutReason = useAuthStore((s) => s.clearSignOutReason)
  const [reason] = useState(() => useAuthStore.getState().signOutReason)
  useEffect(() => {
    if (reason) clearSignOutReason()
  }, [reason, clearSignOutReason])
  return reason
}
