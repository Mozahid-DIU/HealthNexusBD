import { ROLE_HOME } from '@/app/navigation'
import type { AuthUser } from '@/types/api'

/**
 * Where a user lands after authenticating: back to the page they were sent away from
 * (only if it belongs to their own section), otherwise their role's home.
 */
export function routeForUser(user: AuthUser, from?: unknown): string {
  const home = ROLE_HOME[user.role]
  if (typeof from !== 'string') return home
  // Compare the path only (a query string is fine), and only within the user's own section.
  const path = from.split(/[?#]/)[0] ?? ''
  return path === home || path.startsWith(`${home}/`) ? from : home
}

/** Reads the `from` path that the auth guard stores in router state. */
export function fromState(state: unknown): string | undefined {
  if (state && typeof state === 'object' && 'from' in state) {
    const from = (state as { from: unknown }).from
    return typeof from === 'string' ? from : undefined
  }
  return undefined
}
