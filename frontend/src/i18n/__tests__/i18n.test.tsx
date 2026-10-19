import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { i18n, currentLanguage, isLanguage } from '@/i18n'
import { LanguageToggle } from '@/components/i18n/LanguageToggle'

describe('i18n runtime', () => {
  it('starts in English and translates typed keys', () => {
    expect(currentLanguage()).toBe('en')
    expect(i18n.t('auth.login.title')).toBe('Welcome back')
  })

  it('interpolates values', async () => {
    await i18n.changeLanguage('bn')
    expect(i18n.t('auth.forgot.subtitleReset', { email: 'a@b.bd' })).toContain('a@b.bd')
  })

  it('sets <html lang> and remembers the choice', async () => {
    await i18n.changeLanguage('bn')
    expect(document.documentElement.lang).toBe('bn')
    expect(localStorage.getItem('healthnexus-lang')).toBe('bn')
  })

  it('does not split server messages on ":" (single namespace)', () => {
    expect(i18n.t('Error: something' as never, { defaultValue: 'Error: something' })).toBe('Error: something')
  })

  it('validates language codes', () => {
    expect(isLanguage('bn')).toBe(true)
    expect(isLanguage('fr')).toBe(false)
    expect(isLanguage(undefined)).toBe(false)
  })
})

describe('LanguageToggle', () => {
  it('switches language and marks the active option', async () => {
    render(<LanguageToggle />)
    const bnButton = screen.getByRole('button', { name: 'বাংলা' })
    expect(screen.getByRole('button', { name: 'English' })).toHaveAttribute('aria-pressed', 'true')

    await userEvent.click(bnButton)

    expect(currentLanguage()).toBe('bn')
    expect(screen.getByRole('button', { name: 'বাংলা' })).toHaveAttribute('aria-pressed', 'true')
  })
})
