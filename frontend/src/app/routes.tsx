import type { RouteObject } from 'react-router-dom'
import { LandingPage } from '@/features/landing/LandingPage'
import type { Role } from '@/types/api'
import { GuestOnly, RequireRole, RoleHomeRedirect } from './guards'
import { NotFoundPage, RouteError } from './ErrorPages'
import { RootLayout, RouteLoading } from './RootLayout'
import { ROLE_HOME } from './navigation'

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
const accountOverview = async () => ({
  Component: (await import('@/features/account/AccountOverview')).AccountOverview,
})

function roleSection(role: Role): RouteObject {
  return {
    path: ROLE_HOME[role],
    element: <RequireRole role={role} />,
    children: [{ lazy: dashboardLayout, children: [{ index: true, lazy: accountOverview }] }],
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
      roleSection('patient'),
      roleSection('doctor'),
      roleSection('lab'),
      roleSection('admin'),
      { path: '/app', element: <RoleHomeRedirect /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]
