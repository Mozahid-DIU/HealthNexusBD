import type { ComponentType } from 'react'
import type { RouteObject } from 'react-router-dom'
import { LandingPage } from '@/features/landing/LandingPage'
import type { Role } from '@/types/api'
import { GuestOnly, RequireRole, RoleHomeRedirect } from './guards'
import { NotFoundPage, RouteError } from './ErrorPages'
import { RootLayout, RouteLoading } from './RootLayout'
import { ROLE_HOME } from './navigation'
import { loadArea } from '@/i18n'

/**
 * Code-split routes: the landing page never downloads form, validation or dashboard
 * code. The router waits for a chunk before switching pages, so there is no flicker.
 */
const loginPage = async () => ({ Component: (await import('@/features/auth/LoginPage')).LoginPage })
const registerPage = async () => ({ Component: (await import('@/features/auth/RegisterPage')).RegisterPage })
const forgotPasswordPage = async () => ({
  Component: (await import('@/features/auth/ForgotPasswordPage')).ForgotPasswordPage,
})
const dashboardLayout = async () => ({
  Component: (await import('@/components/layout/dashboard/DashboardLayout')).DashboardLayout,
})

const patientPage = <K extends string>(load: () => Promise<Record<K, ComponentType>>, name: K) => async () => {
  // The page and its strings load together, so it never renders untranslated keys.
  const [module] = await Promise.all([load(), loadArea('patient')])
  return { Component: module[name] }
}

const doctorPage = <K extends string>(load: () => Promise<Record<K, ComponentType>>, name: K) => async () => {
  const [module] = await Promise.all([load(), loadArea('doctor')])
  return { Component: module[name] }
}

const labPage = <K extends string>(load: () => Promise<Record<K, ComponentType>>, name: K) => async () => {
  const [module] = await Promise.all([load(), loadArea('lab')])
  return { Component: module[name] }
}

const adminPage = <K extends string>(load: () => Promise<Record<K, ComponentType>>, name: K) => async () => {
  const [module] = await Promise.all([load(), loadArea('admin')])
  return { Component: module[name] }
}

/** Admin console pages, relative to /admin. */
const ADMIN_PAGES: RouteObject[] = [
  { index: true, lazy: adminPage(() => import('@/features/admin/AdminHome'), 'AdminHome') },
  { path: 'verifications', lazy: adminPage(() => import('@/features/admin/VerificationsPage'), 'VerificationsPage') },
  { path: 'users', lazy: adminPage(() => import('@/features/admin/UsersPage'), 'UsersPage') },
  { path: 'audit', lazy: adminPage(() => import('@/features/admin/AuditLogPage'), 'AuditLogPage') },
]

/** Lab pages, relative to /lab, behind the "pending verification" gate. */
const LAB_PAGES: RouteObject[] = [
  {
    lazy: labPage(() => import('@/features/lab/LabGate'), 'LabGate'),
    children: [
      { index: true, lazy: labPage(() => import('@/features/lab/LabHome'), 'LabHome') },
      { path: 'upload', lazy: labPage(() => import('@/features/lab/UploadReportPage'), 'UploadReportPage') },
      { path: 'uploads', lazy: labPage(() => import('@/features/lab/UploadsPage'), 'UploadsPage') },
    ],
  },
]

/** Doctor pages, relative to /doctor, all behind the "pending verification" gate. */
const DOCTOR_PAGES: RouteObject[] = [
  {
    lazy: doctorPage(() => import('@/features/doctor/DoctorGate'), 'DoctorGate'),
    children: [
      { index: true, lazy: doctorPage(() => import('@/features/doctor/DoctorHome'), 'DoctorHome') },
      { path: 'find', lazy: doctorPage(() => import('@/features/doctor/FindPatientPage'), 'FindPatientPage') },
      { path: 'patients', lazy: doctorPage(() => import('@/features/doctor/MyPatientsPage'), 'MyPatientsPage') },
      { path: 'patients/:patientId', lazy: doctorPage(() => import('@/features/doctor/PatientChartPage'), 'PatientChartPage') },
    ],
  },
]

/** Patient pages, relative to /patient. */
const PATIENT_PAGES: RouteObject[] = [
  { index: true, lazy: patientPage(() => import('@/features/patient/PatientHome'), 'PatientHome') },
  { path: 'records', lazy: patientPage(() => import('@/features/patient/RecordsPage'), 'RecordsPage') },
  { path: 'records/:recordId', lazy: patientPage(() => import('@/features/patient/RecordDetailPage'), 'RecordDetailPage') },
  { path: 'lab-reports', lazy: patientPage(() => import('@/features/patient/LabReportsPage'), 'LabReportsPage') },
  { path: 'consent', lazy: patientPage(() => import('@/features/patient/ConsentPage'), 'ConsentPage') },
  { path: 'notifications', lazy: patientPage(() => import('@/features/patient/NotificationsPage'), 'NotificationsPage') },
  { path: 'audit', lazy: patientPage(() => import('@/features/patient/AuditPage'), 'AuditPage') },
  { path: 'profile', lazy: patientPage(() => import('@/features/patient/ProfilePage'), 'ProfilePage') },
]

function roleSection(role: Role, pages: RouteObject[]): RouteObject {
  return {
    path: ROLE_HOME[role],
    element: <RequireRole role={role} />,
    children: [{ lazy: dashboardLayout, children: pages }],
  }
}

export const routes: RouteObject[] = [
  {
    element: <RootLayout />,
    errorElement: <RouteError />,
    // Shown only on a first visit straight to a code-split page, while its chunk loads.
    hydrateFallbackElement: <RouteLoading />,
    children: [
      { path: '/', element: <LandingPage /> },
      {
        element: <GuestOnly />,
        children: [
          { path: '/login', lazy: loginPage },
          { path: '/register', lazy: registerPage },
        ],
      },
      // Reachable while signed in too (e.g. resetting from a second device).
      { path: '/forgot-password', lazy: forgotPasswordPage },
      roleSection('patient', PATIENT_PAGES),
      roleSection('doctor', DOCTOR_PAGES),
      roleSection('lab', LAB_PAGES),
      roleSection('admin', ADMIN_PAGES),
      { path: '/app', element: <RoleHomeRedirect /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]
