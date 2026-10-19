import { useTranslation } from 'react-i18next'
import { LANGUAGES, type Language } from '@/i18n'

interface LanguageToggleProps {
  /** `light` sits on white surfaces; `dark` on the brand gradient. */
  tone?: 'light' | 'dark'
  className?: string
}

const SHORT: Record<Language, 'language.enShort' | 'language.bnShort'> = {
  en: 'language.enShort',
  bn: 'language.bnShort',
}
const FULL: Record<Language, 'language.en' | 'language.bn'> = {
  en: 'language.en',
  bn: 'language.bn',
}

/** Two-option EN / বাং switch. The choice is persisted and sets <html lang>. */
export function LanguageToggle({ tone = 'light', className = '' }: LanguageToggleProps) {
  const { t, i18n } = useTranslation()
  const active = i18n.language

  const track =
    tone === 'dark' ? 'bg-white/10 ring-1 ring-white/20' : 'bg-surface-soft ring-1 ring-line'
  const idle = tone === 'dark' ? 'text-white/70 hover:text-white' : 'text-slate hover:text-brand'
  const selected = tone === 'dark' ? 'bg-white text-brand shadow-sm' : 'bg-white text-brand shadow-card'

  return (
    <div role="group" aria-label={t('language.switchTo')} className={`inline-flex rounded-lg p-0.5 ${track} ${className}`}>
      {LANGUAGES.map((lang) => {
        const isActive = active === lang
        return (
          <button
            key={lang}
            type="button"
            lang={lang}
            aria-pressed={isActive}
            aria-label={t(FULL[lang])}
            onClick={() => {
              if (!isActive) void i18n.changeLanguage(lang)
            }}
            className={`min-w-[38px] rounded-md px-2.5 py-1 text-xs font-bold transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-brand ${
              isActive ? selected : idle
            }`}
          >
            {t(SHORT[lang])}
          </button>
        )
      })}
    </div>
  )
}
