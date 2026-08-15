import { Navbar } from '@/components/layout/Navbar'
import { Hero } from './Hero'
import { TrustBadges } from './TrustBadges'
import { Container } from '@/components/ui/Container'

/**
 * Public landing page. This is the first slice — Navbar + Hero + trust strip.
 * Features grid, "how it works", stats, and footer land in the next step.
 */
export function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-body">
      <Navbar />
      <Hero />
      <TrustBadges />

      {/* Footer (temporary — full sections come next) */}
      <footer className="border-t border-line bg-white py-10">
        <Container className="flex flex-col items-center gap-2 text-center">
          <p className="text-sm font-bold text-brand">
            HealthNexus <span className="text-teal">BD</span>
          </p>
          <p className="text-xs text-slate">
            Secure, AI-powered unified health records for Bangladesh.
          </p>
        </Container>
      </footer>
    </div>
  )
}
