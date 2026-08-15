import { useQuery, useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { api } from '@/lib/api'
import { authApi } from '@/features/auth/api'
import { useAuthStore } from '@/stores/auth'
import type { AuthUser } from '@/types/api'
import { Container } from '@/components/ui/Container'
import { Button } from '@/components/ui/Button'
import { Logo } from '@/components/brand/icons'

/**
 * Temporary authenticated home. It fetches the LIVE profile from the backend
 * (/auth/me) to prove the real connection — the full role dashboards replace this next.
 */
export function AppHome() {
  const navigate = useNavigate()
  const clear = useAuthStore((s) => s.clear)

  const { data, isLoading, isError } = useQuery({
    queryKey: ['me'],
    queryFn: () => authApi.me(),
  })

  const logout = useMutation({
    mutationFn: () => api.post('/auth/logout'),
    onSettled: () => {
      clear()
      navigate('/login', { replace: true })
    },
  })

  const user = data?.data as AuthUser | undefined
  const profile = (user?.patient ?? user?.doctor ?? user?.lab ?? user?.admin) as
    | Record<string, unknown>
    | undefined
  const displayName =
    (profile?.fullName as string) ?? (profile?.centerName as string) ?? user?.email ?? 'there'

  return (
    <div className="min-h-screen bg-surface-soft">
      <header className="border-b border-line bg-white">
        <Container className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-brand text-teal">
              <Logo />
            </span>
            <span className="text-[17px] font-extrabold tracking-tight text-brand">
              HealthNexus <span className="text-teal">BD</span>
            </span>
          </div>
          <Button variant="outline" size="sm" onClick={() => logout.mutate()} disabled={logout.isPending}>
            {logout.isPending ? 'Logging out…' : 'Log out'}
          </Button>
        </Container>
      </header>

      <Container className="py-12">
        {isLoading && <p className="text-sm text-slate">Loading your profile…</p>}
        {isError && <p className="text-sm text-red-500">Could not load your profile.</p>}

        {user && (
          <div className="max-w-lg rounded-2xl border border-line bg-white p-8 shadow-card">
            <p className="text-sm text-slate">Signed in as</p>
            <h1 className="mt-1 text-2xl font-black text-ink">{displayName}</h1>

            <div className="mt-5 flex flex-wrap gap-2">
              <span className="rounded-full bg-brand/10 px-3 py-1 text-xs font-bold uppercase tracking-wide text-brand">
                {user.role}
              </span>
              <span
                className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ${
                  user.status === 'active'
                    ? 'bg-emerald-50 text-emerald-600'
                    : user.status === 'pending'
                      ? 'bg-amber-50 text-amber-600'
                      : 'bg-red-50 text-red-600'
                }`}
              >
                {user.status}
              </span>
            </div>

            {typeof profile?.uhid === 'string' && (
              <div className="mt-6 rounded-xl border border-line bg-surface-soft px-4 py-3">
                <p className="text-[10px] uppercase tracking-widest text-faint">Your UHID</p>
                <p className="font-mono text-lg font-bold text-brand">{profile.uhid}</p>
              </div>
            )}

            {user.status === 'pending' && (
              <p className="mt-5 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-700">
                Your account is pending admin verification. You'll get full access once approved.
              </p>
            )}

            <p className="mt-6 text-sm text-slate">
              ✅ This data is loaded live from the backend — your full dashboard is coming next.
            </p>
          </div>
        )}
      </Container>
    </div>
  )
}
