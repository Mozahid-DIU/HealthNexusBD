import { useNavigate } from 'react-router-dom'
import { Container } from '@/components/ui/Container'
import { Button } from '@/components/ui/Button'

/** Faint mesh + heartbeat texture behind the hero. */
function HeroTexture() {
  return (
    <svg
      className="pointer-events-none absolute inset-0 h-full w-full"
      style={{ opacity: 0.055 }}
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <pattern id="mesh" x="0" y="0" width="48" height="48" patternUnits="userSpaceOnUse">
          <path d="M48 0H0v48" fill="none" stroke="var(--color-brand)" strokeWidth="0.8" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#mesh)" />
    </svg>
  )
}

export function Hero() {
  const navigate = useNavigate()

  return (
    <section id="home" className="relative overflow-hidden bg-white">
      <HeroTexture />
      <Container className="grid min-h-[620px] items-center gap-12 py-16 md:grid-cols-2">
        <div className="relative z-10">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-teal/30 bg-teal/10 px-3.5 py-1.5">
            <span className="h-[7px] w-[7px] rounded-full bg-teal shadow-[0_0_0_3px_rgba(15,163,163,0.25)]" />
            <span className="text-[11px] font-bold uppercase tracking-[0.1em] text-teal">
              Bangladesh National Health Platform
            </span>
          </div>

          <h1 className="mb-5 text-[clamp(2rem,4.5vw,3.1rem)] font-black leading-[1.13] tracking-tight text-ink">
            One Lifelong
            <br />
            <span className="text-brand">Health ID</span>
            <br />
            for Every Citizen
          </h1>

          <p className="mb-9 max-w-[440px] text-base leading-[1.75] text-muted">
            HealthNexus BD unifies your entire medical history under one secure identifier. Own your
            records, authorize doctors with an OTP, and get AI-powered clinical summaries — all
            encrypted end-to-end.
          </p>

          <div className="flex flex-wrap gap-3">
            <Button size="lg" onClick={() => navigate('/register')}>
              Get Started — Free
            </Button>
            <Button variant="outline" size="lg" onClick={() => navigate('/login')}>
              I already have an account
            </Button>
          </div>
        </div>

        {/* Right visual */}
        <div className="relative z-10 hidden md:block">
          <HeroCard />
        </div>
      </Container>
    </section>
  )
}

/** A stylized UHID card as the hero visual (placeholder illustration). */
function HeroCard() {
  return (
    <div className="relative mx-auto max-w-[420px]">
      <div className="rounded-2xl border border-line bg-gradient-to-br from-brand to-[#0a4f99] p-7 text-white shadow-[0_24px_60px_rgba(11,92,173,0.35)]">
        <div className="mb-8 flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-widest text-white/70">
            Unified Health ID
          </span>
          <span className="rounded-md bg-white/15 px-2 py-0.5 text-[10px] font-bold">BD</span>
        </div>
        <p className="mb-1 text-[10px] uppercase tracking-widest text-white/60">UHID format</p>
        <p className="mb-8 font-mono text-2xl font-bold tracking-wide">BD-YYYY-XXXXX</p>
        <div className="flex items-end justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-white/60">Holder</p>
            <p className="text-sm font-semibold">Your lifelong identity</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-widest text-white/60">Issued by</p>
            <p className="text-sm font-semibold">HealthNexus BD</p>
          </div>
        </div>
      </div>
      <div className="absolute -right-4 -top-4 -z-10 h-full w-full rounded-2xl bg-teal/20" />
    </div>
  )
}
