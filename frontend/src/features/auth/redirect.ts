import type { AuthUser } from '@/types/api'

/** Where a user lands after authenticating, based on their role. */
export function routeForUser(user: AuthUser): string {
  return user.role === 'admin' ? '/admin' : '/app'
}
