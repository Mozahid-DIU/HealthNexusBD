import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Logo } from '@/components/brand/icons'
import { Container } from '@/components/ui/Container'
import { useLanguage } from '@/i18n/useLanguage'

export function Footer() {
  const { t } = useTranslation()
  const lang = useLanguage()
  const columns = [
    {
      title: t('landing.footer.product'),
      links: [
        { label: t('landing.nav.features'), href: '#features' },
        { label: t('landing.nav.howItWorks'), href: '#how-it-works' },
        { label: t('landing.nav.security'), href: '#security' },
        { label: t('landing.nav.about'), href: '#about' },
      ],
    },
    {
      title: t('landing.footer.forWhom'),
      links: [
        { label: t('landing.roles.patient'), to: '/register' },
        { label: t('landing.roles.doctor'), to: '/register' },
        { label: t('landing.roles.lab'), to: '/register' },
      ],
    },
    {
      title: t('landing.footer.account'),
      links: [
        { label: t('landing.nav.login'), to: '/login' },
        { label: t('landing.nav.registerFree'), to: '/register' },
      ],
    },
  ]
  const linkClass = 'text-sm text-white/60 transition hover:text-white focus-visible:outline-2 focus-visible:outline-teal'

  return (
    <footer className="bg-[#06142a] text-white">
      <Container className="grid gap-12 py-16 md:grid-cols-[1.4fr_repeat(3,1fr)]">
        <div>
          <Link to="/" className="inline-flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-linear-to-br from-brand to-teal">
              <Logo />
            </span>
            <span className="text-[17px] font-extrabold tracking-tight">
              HealthNexus <span className="text-teal">BD</span>
            </span>
          </Link>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-white/60">{t('landing.footer.tagline')}</p>
        </div>
        {columns.map((col) => (
          <nav key={col.title} aria-label={col.title}>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/60">{col.title}</p>
            <ul className="mt-4 space-y-2.5">
              {col.links.map((link) => (
                <li key={link.label}>
                  {'to' in link ? (
                    <Link to={link.to} className={linkClass}>
                      {link.label}
                    </Link>
                  ) : (
                    <a href={link.href} className={linkClass}>
                      {link.label}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </Container>
      <div className="border-t border-white/10">
        <Container className="flex flex-col items-center justify-between gap-2 py-6 text-xs text-white/60 sm:flex-row">
          <p>
            © {new Intl.NumberFormat(lang === 'bn' ? 'bn-BD' : 'en-GB', { useGrouping: false }).format(new Date().getFullYear())}{' '}
            {t('landing.footer.rights')}
          </p>
          <div className="flex items-center gap-5">
            <p>{t('landing.footer.madeIn')}</p>
            <Link to="/admin/login" className="text-white/60 transition hover:text-white focus-visible:outline-2 focus-visible:outline-teal">
              {t('landing.footer.admin')}
            </Link>
          </div>
        </Container>
      </div>
    </footer>
  )
}
