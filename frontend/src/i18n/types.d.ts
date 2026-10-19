import 'i18next'
import type { Messages } from './locales/en'

// Typed keys: `t('auth.login.title')` is checked at compile time, so a typo is a build error.
declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'translation'
    resources: { translation: Messages }
    returnNull: false
  }
}
