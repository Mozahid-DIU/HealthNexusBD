import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowRight, CheckCircle2, FlaskConical, ShieldCheck, Stethoscope, UserRound, type LucideIcon } from 'lucide-react'
import { Container } from '@/components/ui/Container'
import { Tabs } from '@/components/ui/Tabs'
import { Reveal } from './motion'
import { SectionHeading } from './SectionHeading'

type RoleId = 'patient' | 'doctor' | 'lab' | 'admin'

const ROLES: Array<{ id: RoleId; icon: LucideIcon; accent: string }> = [
  { id: 'patient', icon: UserRound, accent: 'from-brand to-[#1d8fe0]' },
  { id: 'doctor', icon: Stethoscope, accent: 'from-[#0b7f86] to-teal' },
  { id: 'lab', icon: FlaskConical, accent: 'from-[#d4561f] to-[#eb6834]' },
  { id: 'admin', icon: ShieldCheck, accent: 'from-navy to-[#1f3c66]' },
]

/** What each kind of user gets, one role at a time. */
export function Roles() {
  const { t } = useTranslation()
  const [role, setRole] = useState<RoleId>('patient')
  const current = ROLES.find((r) => r.id === role)!
  const points = ([1, 2, 3, 4] as const).map((n) => t(`landing.roles.${role}${n}`))

  return (
    <section className="bg-white py-24 sm:py-32">
      <Container>
        <SectionHeading eyebrow={t('landing.roles.eyebrow')} title={t('landing.roles.title')} />
        <Reveal className="mx-auto mt-12 max-w-4xl">
          <Tabs
            label={t('landing.roles.tabs')}
            value={role}
            onChange={setRole}
            tabs={ROLES.map((r) => ({ id: r.id, label: t(`landing.roles.${r.id}`) }))}
          >
            <div key={role} className="lp-rise grid overflow-hidden rounded-3xl border border-line bg-surface-soft md:grid-cols-[0.9fr_1.1fr]">
              <div className={`relative flex flex-col justify-between gap-8 overflow-hidden bg-linear-to-br p-8 text-white ${current.accent}`}>
                <span aria-hidden className="absolute -bottom-16 -right-16 h-56 w-56 rounded-full bg-white/10" />
                <span className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/25 backdrop-blur">
                  <current.icon aria-hidden className="h-7 w-7" />
                </span>
                <p className="relative text-2xl font-black leading-snug tracking-tight">{t(`landing.roles.${role}Lead`)}</p>
              </div>
              <div className="p-8">
                <ul className="space-y-4">
                  {points.map((point) => (
                    <li key={point} className="flex gap-3 text-[15px] font-medium text-body">
                      <CheckCircle2 aria-hidden className="mt-0.5 h-5 w-5 shrink-0 text-teal" />
                      {point}
                    </li>
                  ))}
                </ul>
                <Link
                  to="/register"
                  className="group mt-8 inline-flex items-center gap-2 text-sm font-bold text-brand hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
                >
                  {t('landing.roles.cta')}
                  <ArrowRight aria-hidden className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            </div>
          </Tabs>
        </Reveal>
      </Container>
    </section>
  )
}
