import '@testing-library/jest-dom/vitest'
import { afterEach, beforeEach } from 'vitest'
import { cleanup, configure } from '@testing-library/react'
import { i18n, loadArea } from '@/i18n'
import { useAuthStore } from '@/stores/auth'

// Code-split routes load their chunk before rendering; under a busy parallel run that can
// exceed Testing Library's 1s default wait, so allow more time (no test relies on it).
configure({ asyncUtilTimeout: 10_000 })

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

// jsdom implements neither scrolling nor object URLs.
window.scrollTo = () => {}
if (!URL.createObjectURL) URL.createObjectURL = () => 'blob:test'
if (!URL.revokeObjectURL) URL.revokeObjectURL = () => {}

// Tests render area pages directly, so make every area's strings available up front.
await Promise.all([loadArea('patient'), loadArea('doctor'), loadArea('lab'), loadArea('admin'), loadArea('landing')])

beforeEach(async () => {
  localStorage.clear()
  useAuthStore.getState().clear()
  await i18n.changeLanguage('en')
})

afterEach(() => {
  cleanup()
})
