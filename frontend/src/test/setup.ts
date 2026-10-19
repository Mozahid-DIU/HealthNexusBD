import '@testing-library/jest-dom/vitest'
import { afterEach, beforeEach } from 'vitest'
import { cleanup, configure } from '@testing-library/react'
import { i18n } from '@/i18n'
import { useAuthStore } from '@/stores/auth'

// Code-split routes load their chunk before rendering; under a busy parallel run that can
// exceed Testing Library's 1s default wait, so allow more time (no test relies on it).
configure({ asyncUtilTimeout: 5000 })

// jsdom has no matchMedia; default to a phone-sized viewport (no media query matches).
if (typeof window.matchMedia !== 'function') {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }),
  })
}

beforeEach(async () => {
  localStorage.clear()
  useAuthStore.getState().clear()
  await i18n.changeLanguage('en')
})

afterEach(() => {
  cleanup()
})
