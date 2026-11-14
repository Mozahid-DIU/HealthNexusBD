import { Reveal } from './motion'

/** Eyebrow · headline · lead, the same rhythm for every section. */
export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  tone = 'light',
  align = 'center',
}: {
  eyebrow: string
  title: string
  subtitle?: string
  tone?: 'light' | 'dark'
  align?: 'center' | 'left'
}) {
  const dark = tone === 'dark'
  return (
    <Reveal className={align === 'center' ? 'mx-auto max-w-3xl text-center' : 'max-w-2xl'}>
      <p className={`text-xs font-bold uppercase tracking-[0.2em] ${dark ? 'text-teal' : 'text-brand'}`}>{eyebrow}</p>
      <h2
        className={`mt-4 text-[clamp(1.9rem,4vw,3rem)] font-black leading-[1.1] tracking-tight ${dark ? 'text-white' : 'text-ink'}`}
      >
        {title}
      </h2>
      {subtitle && <p className={`mt-4 text-lg leading-relaxed ${dark ? 'text-white/65' : 'text-slate'}`}>{subtitle}</p>}
    </Reveal>
  )
}
