import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { queryClient } from '@/lib/queryClient'
import type { AuthUser } from '@/types/api'

/** Why the app signed the user out on its own (shown once on the login page). */
export type SignOutReason = 'expired' | 'suspended'

interface AuthState {
  user: AuthUser | null
  accessToken: string | null
  refreshToken: string | null
  signOutReason: SignOutReason | null
  isAuthenticated: () => boolean
  setAuth: (user: AuthUser, accessToken: string, refreshToken: string) => void
  setAccessToken: (accessToken: string) => void
  setUser: (user: AuthUser) => void
  /** User-initiated sign-out. */
  clear: () => void
  /** The server ended the session (revoked, expired or suspended). */
  endSession: (reason: SignOutReason) => void
  clearSignOutReason: () => void
}

const SIGNED_OUT = { user: null, accessToken: null, refreshToken: null } as const

/**
 * Auth session store, persisted to localStorage so a page refresh keeps the user
 * logged in. Tokens are read by the API client to authorize requests.
 *
 * Every change of identity also empties the React Query cache, so one user's medical
 * data can never be shown to the next person who signs in on the same browser.
 */
export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      ...SIGNED_OUT,
      signOutReason: null,
      isAuthenticated: () => Boolean(get().accessToken && get().user),
      setAuth: (user, accessToken, refreshToken) => {
        queryClient.clear()
        set({ user, accessToken, refreshToken, signOutReason: null })
      },
      // Late responses must never revive a signed-out session.
      setAccessToken: (accessToken) => {
        if (get().refreshToken) set({ accessToken })
      },
      setUser: (user) => {
        if (get().accessToken && get().user?.id === user.id) set({ user })
      },
      clear: () => {
        queryClient.clear()
        set({ ...SIGNED_OUT, signOutReason: null })
      },
      endSession: (reason) => {
        queryClient.clear()
        set({ ...SIGNED_OUT, signOutReason: reason })
      },
      clearSignOutReason: () => set({ signOutReason: null }),
    }),
    {
      name: 'healthnexus-auth',
      // Only the session itself survives a reload; the one-off reason does not.
      partialize: ({ user, accessToken, refreshToken }) => ({ user, accessToken, refreshToken }),
    },
  ),
)

/**
 * Keep tabs in sync: when another tab signs in or out, adopt its session (and drop any
 * cached data from the previous one) instead of overwriting it with this tab's copy.
 */
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key !== 'healthnexus-auth') return
    const before = useAuthStore.getState().user?.id ?? null
    void Promise.resolve(useAuthStore.persist.rehydrate()).then(() => {
      if ((useAuthStore.getState().user?.id ?? null) !== before) queryClient.clear()
    })
  })
}
