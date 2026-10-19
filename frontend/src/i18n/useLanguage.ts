import { useTranslation } from 'react-i18next'
import { isLanguage, type Language } from './index'

/** The active language; components using it re-render when it changes. */
export function useLanguage(): Language {
  const { i18n } = useTranslation()
  return isLanguage(i18n.language) ? i18n.language : 'en'
}
