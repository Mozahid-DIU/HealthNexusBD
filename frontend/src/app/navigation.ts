import {
  Bell,
  FlaskConical,
  History,
  LayoutDashboard,
  ScrollText,
  Search,
  ShieldCheck,
  Stethoscope,
  Upload,
  UserRound,
  UsersRound,
  type LucideIcon,
} from 'lucide-react'
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
  patient: [
    { to: ROLE_HOME.patient, label: 'dashboard.nav.overview', icon: LayoutDashboard, end: true },
    { to: '/patient/records', label: 'dashboard.nav.records', icon: Stethoscope },
    { to: '/patient/lab-reports', label: 'dashboard.nav.labReports', icon: FlaskConical },
    { to: '/patient/consent', label: 'dashboard.nav.consent', icon: ShieldCheck },
    { to: '/patient/notifications', label: 'dashboard.nav.notifications', icon: Bell },
    { to: '/patient/audit', label: 'dashboard.nav.audit', icon: ScrollText },
    { to: '/patient/profile', label: 'dashboard.nav.profile', icon: UserRound },
  ],
  doctor: [
    { to: ROLE_HOME.doctor, label: 'dashboard.nav.overview', icon: LayoutDashboard, end: true },
    { to: '/doctor/find', label: 'dashboard.nav.findPatient', icon: Search },
    { to: '/doctor/patients', label: 'dashboard.nav.myPatients', icon: UsersRound },
  ],
  lab: [
    { to: ROLE_HOME.lab, label: 'dashboard.nav.overview', icon: LayoutDashboard, end: true },
    { to: '/lab/upload', label: 'dashboard.nav.uploadReport', icon: Upload },
    { to: '/lab/uploads', label: 'dashboard.nav.uploadHistory', icon: History },
  ],
  admin: [{ to: ROLE_HOME.admin, label: 'dashboard.nav.overview', icon: LayoutDashboard, end: true }],
}
