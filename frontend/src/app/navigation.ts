import { LayoutDashboard, type LucideIcon } from 'lucide-react'
import type { TranslationKey } from '@/i18n'
import type { Role } from '@/types/api'

export interface NavItem {
  to: string
  label: TranslationKey
  icon: LucideIcon
  /** Match the path exactly (for section index routes). */
  end?: boolean
}

/** Each role's dashboard lives under its own prefix. */
export const ROLE_HOME: Record<Role, string> = {
  patient: '/patient',
  doctor: '/doctor',
  lab: '/lab',
  admin: '/admin',
}

/** Sidebar entries per role. Pages are added here as each phase ships them. */
export const NAVIGATION: Record<Role, NavItem[]> = {
  patient: [{ to: ROLE_HOME.patient, label: 'dashboard.nav.overview', icon: LayoutDashboard, end: true }],
  doctor: [{ to: ROLE_HOME.doctor, label: 'dashboard.nav.overview', icon: LayoutDashboard, end: true }],
  lab: [{ to: ROLE_HOME.lab, label: 'dashboard.nav.overview', icon: LayoutDashboard, end: true }],
  admin: [{ to: ROLE_HOME.admin, label: 'dashboard.nav.overview', icon: LayoutDashboard, end: true }],
}
