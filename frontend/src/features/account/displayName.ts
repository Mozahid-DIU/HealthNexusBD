import type { AuthUser } from '@/types/api'

/** The human name to show for a user: their profile name, else their email. */
export function displayName(user: AuthUser): string {
  return (
    user.patient?.fullName ??
    user.doctor?.fullName ??
    user.lab?.centerName ??
    user.admin?.fullName ??
    user.email
  )
}
