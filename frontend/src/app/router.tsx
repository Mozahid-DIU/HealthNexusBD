import { createBrowserRouter, Navigate } from 'react-router-dom'
import { LandingPage } from '@/features/landing/LandingPage'

/** Temporary placeholder for screens still being built. */
function ComingSoon({ title }: { title: string }) {
  return (
    <div className="grid min-h-screen place-items-center bg-surface-soft px-6 text-center">
      <div>
        <p className="text-2xl font-black text-brand">{title}</p>
        <p className="mt-2 text-sm text-slate">This screen is being built next. 🚧</p>
        <a href="/" className="mt-4 inline-block text-sm font-semibold text-teal hover:underline">
          ← Back to home
        </a>
      </div>
    </div>
  )
}

export const router = createBrowserRouter([
  { path: '/', element: <LandingPage /> },
  { path: '/login', element: <ComingSoon title="Login" /> },
  { path: '/register', element: <ComingSoon title="Register" /> },
  { path: '*', element: <Navigate to="/" replace /> },
])
