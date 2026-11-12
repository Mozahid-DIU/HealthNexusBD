import './landing.css'
import { useTranslation } from 'react-i18next'
import { About } from './About'
import { Features } from './Features'
import { Footer } from './Footer'
import { Hero } from './Hero'
import { HowItWorks } from './HowItWorks'
import { Navbar } from './Navbar'
import { Roles } from './Roles'
import { Security } from './Security'
import { TrustStrip } from './TrustStrip'

/**
 * Public landing page: a dark, animated hero showing the product's core moments, then
 * features, the consent flow, the four roles, the real security numbers and a call to
 * action. Its code, styles and strings load as their own chunk.
 */
export function LandingPage() {
  const { t } = useTranslation()
  return (
    <div className="min-h-screen bg-white text-body">
      <a
        href="#main-content"
        className="sr-only z-[120] rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        {t('common.skipToContent')}
      </a>
      <Navbar />
      <main id="main-content" tabIndex={-1} className="outline-none">
        <Hero />
        <TrustStrip />
        <Features />
        <HowItWorks />
        <Roles />
        <Security />
        <About />
      </main>
      <Footer />
    </div>
  )
}
