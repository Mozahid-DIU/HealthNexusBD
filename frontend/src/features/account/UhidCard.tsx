import { useTranslation } from 'react-i18next'

/** The patient's lifelong Health ID, styled like an ID card. */
export function UhidCard({ uhid, holder, bloodGroup }: { uhid: string; holder: string; bloodGroup?: string | null }) {
  const { t } = useTranslation()
  return (
    <div className="relative flex min-h-55 flex-col justify-between overflow-hidden rounded-2xl bg-linear-to-br from-brand to-brand-dark p-6 text-white shadow-[0_18px_48px_rgba(11,92,173,0.3)]">
      <svg aria-hidden className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.08]">
        <defs>
          <pattern id="uhidmesh" width="36" height="36" patternUnits="userSpaceOnUse">
            <path d="M36 0H0v36" fill="none" stroke="#fff" strokeWidth="0.8" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#uhidmesh)" />
      </svg>
      <div className="relative">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-white/70">
          {t('dashboard.overview.uhid')}
        </p>
        <p className="mt-2 font-mono text-2xl font-bold tracking-wide sm:text-[1.7rem]">{uhid}</p>
      </div>
      <div className="relative mt-8 flex items-end justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-widest text-white/60">{t('dashboard.overview.holder')}</p>
          <p className="truncate text-sm font-semibold" title={holder}>
            {holder}
          </p>
        </div>
        {bloodGroup && (
          <div className="shrink-0 text-right">
            <p className="text-[10px] uppercase tracking-widest text-white/60">{t('dashboard.overview.bloodGroup')}</p>
            <p className="text-sm font-bold">{bloodGroup}</p>
          </div>
        )}
      </div>
    </div>
  )
}
