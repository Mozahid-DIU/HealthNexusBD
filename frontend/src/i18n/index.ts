import i18next, { type ParseKeys } from 'i18next'
import { initReactI18next } from 'react-i18next'
import { en } from './locales/en'
import { bn } from './locales/bn'

/** Any valid translation key, checked at compile time. */
export type TranslationKey = ParseKeys

export const LANGUAGES = ['en', 'bn'] as const
export type Language = (typeof LANGUAGES)[number]

const STORAGE_KEY = 'healthnexus-lang'
const DEFAULT_LANGUAGE: Language = 'en'

export function isLanguage(value: unknown): value is Language {
  return typeof value === 'string' && (LANGUAGES as readonly string[]).includes(value)
}

/** The saved choice, if any. Storage can be unavailable (private mode), so never throw. */
function readSavedLanguage(): Language | null {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    return isLanguage(saved) ? saved : null
  } catch {
    return null
  }
}

function saveLanguage(lang: Language): void {
  try {
    localStorage.setItem(STORAGE_KEY, lang)
  } catch {
    // Not fatal: the choice just won't survive a reload.
  }
}

function applyToDocument(lang: string): void {
  document.documentElement.lang = lang
}

export const i18n = i18next.createInstance()

void i18n.use(initReactI18next).init({
  resources: { en: { translation: en }, bn: { translation: bn } },
  lng: readSavedLanguage() ?? DEFAULT_LANGUAGE,
  fallbackLng: DEFAULT_LANGUAGE,
  supportedLngs: [...LANGUAGES],
  // Resources are bundled, so init completes synchronously and the first render is translated.
  initAsync: false,
  interpolation: { escapeValue: false }, // React already escapes
  // Server messages can contain ':'; there is a single namespace, so never split on it.
  nsSeparator: false,
  returnNull: false,
})

applyToDocument(i18n.language)
i18n.on('languageChanged', (lng) => {
  applyToDocument(lng)
  if (isLanguage(lng)) saveLanguage(lng)
})

export function currentLanguage(): Language {
  return isLanguage(i18n.language) ? i18n.language : DEFAULT_LANGUAGE
}
