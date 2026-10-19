import { describe, expect, it } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { i18n, type TranslationKey } from '@/i18n'
import { renderPage } from '@/test/render'
import { LoginPage } from '../LoginPage'
import { RegisterPage } from '../RegisterPage'
import { ForgotPasswordPage } from '../ForgotPasswordPage'
import { LandingPage } from '@/features/landing/LandingPage'

/** English sentences that must never appear once the UI is in Bangla. */
const ENGLISH_LEAKS = /Welcome back|Log in to access|Create your account|Choose your role|Reset your password|One Lifelong|Get Started|Enter a valid|At least 8|Required\b|Full name|Password\b/

describe.each(['en', 'bn'] as const)('auth & landing pages in %s', (lang) => {
  const t = (key: TranslationKey) => i18n.t(key, { lng: lang })

  it('login renders translated copy', async () => {
    await i18n.changeLanguage(lang)
    renderPage(<LoginPage />, { path: '/login' })

    expect(screen.getByRole('heading', { name: t('auth.login.title') })).toBeInTheDocument()
    expect(screen.getByLabelText(t('auth.login.identifierLabel'))).toBeInTheDocument()
    if (lang === 'bn') expect(document.body.textContent).not.toMatch(ENGLISH_LEAKS)
  })

  it('login shows validation errors in the active language', async () => {
    await i18n.changeLanguage(lang)
    renderPage(<LoginPage />, { path: '/login' })

    await userEvent.click(screen.getByRole('button', { name: t('auth.login.submit') }))

    expect(await screen.findByText(t('validation.identifier'))).toBeInTheDocument()
    expect(screen.getByText(t('validation.passwordRequired'))).toBeInTheDocument()
  })

  it('register renders every role form translated', async () => {
    await i18n.changeLanguage(lang)
    renderPage(<RegisterPage />, { path: '/register' })

    for (const role of ['roles.doctor', 'roles.lab', 'roles.patient'] as const) {
      await userEvent.click(screen.getByRole('button', { name: t(role) }))
      expect(screen.getByRole('button', { name: t('auth.register.submit') })).toBeInTheDocument()
      if (lang === 'bn') expect(document.body.textContent).not.toMatch(ENGLISH_LEAKS)
    }
  })

  it('register validation errors are translated', async () => {
    await i18n.changeLanguage(lang)
    renderPage(<RegisterPage />, { path: '/register' })

    await userEvent.click(screen.getByRole('button', { name: t('auth.register.submit') }))

    expect(await screen.findByText(t('validation.email'))).toBeInTheDocument()
    expect(screen.getByText(t('validation.nid'))).toBeInTheDocument()
  })

  it('forgot password renders translated copy', async () => {
    await i18n.changeLanguage(lang)
    renderPage(<ForgotPasswordPage />, { path: '/forgot-password' })

    expect(screen.getByRole('heading', { name: t('auth.forgot.titleRequest') })).toBeInTheDocument()
    if (lang === 'bn') expect(document.body.textContent).not.toMatch(ENGLISH_LEAKS)
  })

  it('landing renders translated hero', async () => {
    await i18n.changeLanguage(lang)
    renderPage(<LandingPage />)

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(t('landing.hero.titleHighlight'))
    if (lang === 'bn') expect(document.body.textContent).not.toMatch(ENGLISH_LEAKS)
  })
})

describe('switching language live', () => {
  it('re-renders an open page, including visible errors', async () => {
    renderPage(<LoginPage />, { path: '/login' })
    await userEvent.click(screen.getByRole('button', { name: 'Log in' }))
    expect(await screen.findByText('Enter your email or phone')).toBeInTheDocument()

    await userEvent.click(screen.getAllByRole('button', { name: 'বাংলা' })[0])

    expect(await screen.findByText('ইমেইল বা ফোন নম্বর দিন')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'আবার স্বাগতম' })).toBeInTheDocument()
  })
})
