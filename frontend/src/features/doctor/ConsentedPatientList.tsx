import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { ChevronRight, Clock } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { useLanguage } from '@/i18n/useLanguage'
import { formatNumber, initials } from '@/lib/format'
import { useNow } from '@/lib/useNow'
import { minutesLeft } from '@/features/patient/text'
import type { ConsentedPatient } from './types'

/** Patients with live consent, each with time left and a link to their chart. */
export function ConsentedPatientList({ patients }: { patients: ConsentedPatient[] }) {
  const { t } = useTranslation()
  const lang = useLanguage()
  const now = useNow(15_000)

  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {patients.map((p) => {
        const minutes = minutesLeft(p.consentExpiresAt, now)
        return (
          <li key={p.id}>
            <Link
              to={`/doctor/patients/${p.id}`}
              aria-label={`${t('doctor.patients.open')}: ${p.fullName}`}
              className="group flex items-center gap-3 rounded-2xl border border-line bg-white p-4 shadow-card transition hover:-translate-y-0.5 hover:border-brand/30 hover:shadow-soft focus-visible:outline-2 focus-visible:outline-brand"
            >
              <span
                aria-hidden
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-brand to-teal text-sm font-bold text-white"
              >
                {initials(p.fullName)}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[15px] font-bold text-ink">{p.fullName}</span>
                <span className="block font-mono text-xs text-slate">{p.uhid}</span>
              </span>
              <Badge tone={minutes <= 5 ? 'warning' : 'success'}>
                <Clock aria-hidden className="h-3 w-3" />
                {minutes <= 1
                  ? t('doctor.chart.accessEnding')
                  : t('doctor.chart.minutesLeft', { minutes: formatNumber(minutes, lang) })}
              </Badge>
              <ChevronRight aria-hidden className="h-4 w-4 shrink-0 text-faint transition group-hover:text-brand" />
            </Link>
          </li>
        )
      })}
    </ul>
  )
}
