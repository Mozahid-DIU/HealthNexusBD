import { createBrowserRouter, Navigate } from 'react-router-dom'
import { LandingPage } from '@/features/landing/LandingPage'
import { LoginPage } from '@/features/auth/LoginPage'
import { RegisterPage } from '@/features/auth/RegisterPage'
import { ForgotPasswordPage } from '@/features/auth/ForgotPasswordPage'
import { AppHome } from '@/features/app/AppHome'
import { ProtectedRoute } from './ProtectedRoute'

export const router = createBrowserRouter([
  { path: '/', element: <LandingPage /> },
  { path: '/login', element: <LoginPage /> },
  { path: '/register', element: <RegisterPage /> },
  { path: '/forgot-password', element: <ForgotPasswordPage /> },
  {
    path: '/app',
    element: (
      <ProtectedRoute>
        <AppHome />
      </ProtectedRoute>
    ),
  },
  {
    path: '/admin',
    element: (
      <ProtectedRoute>
        <AppHome />
      </ProtectedRoute>
    ),
  },
  { path: '*', element: <Navigate to="/" replace /> },
])
