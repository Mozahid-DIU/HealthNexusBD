import { Outlet, ScrollRestoration } from 'react-router-dom'
import { Spinner } from '@/components/ui/Feedback'
import { Toaster } from '@/components/ui/Toaster'

/** Wraps every page: toasts and scroll restoration on navigation. */
export function RootLayout() {
  return (
    <>
      <Outlet />
      <Toaster />
      <ScrollRestoration />
    </>
  )
}

/** Full-page placeholder while a code-split page loads on first visit. */
export function RouteLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-soft">
      <Spinner />
    </div>
  )
}
