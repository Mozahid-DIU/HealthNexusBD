import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { i18n } from '@/i18n'
import { renderPage } from '@/test/render'
import { envelope, mockApi } from '@/test/mockApi'
import { parseAccount } from '@/lib/identifier'
import { ForgotPasswordPage } from '../ForgotPasswordPage'

const sent = { body: envelope({ message: 'If an account exists, a reset code has been sent.' }) }

beforeEach(() => {
  vi.unstubAllGlobals()
})

afterEach(async () => {
  vi.useRealTimers()
  await i18n.changeLanguage('en')
})

describe('parseAccount', () => {
  it.each([
    ['You@Example.com ', { kind: 'email', value: 'you@example.com' }],
    ['01999123456', { kind: 'phone', value: '01999123456' }],
    ['+880 1999-123456', { kind: 'phone', value: '01999123456' }],
    ['০১৯৯৯১২৩৪৫৬', { kind: 'phone', value: '01999123456' }],
  ])('reads "%s"', (raw, expected) => {
    expect(parseAccount(raw)).toEqual(expected)
  })

  it.each(['', 'not-an-email@', '0182240898', '1234'])('rejects "%s"', (raw) => {
    expect(parseAccount(raw)).toBeNull()
  })
})

describe('forgot password', () => {
  it('sends the code by SMS to a mobile number and resets with it', async () => {
    const { calls } = mockApi({
      'POST /auth/forgot-password': sent,
      'POST /auth/reset-password': { body: envelope({ message: 'ok' }) },
    })
    renderPage(<ForgotPasswordPage />, { path: '/forgot-password' })

    await userEvent.type(screen.getByLabelText('Email or mobile number'), '+880 1999-123456')
    await userEvent.click(screen.getByRole('button', { name: 'Send reset code' }))

    expect(await screen.findByText('Enter the 6-digit code we sent by SMS to 01999123456.')).toBeInTheDocument()
    expect(calls[0]?.body).toEqual({ identifier: '01999123456' })

    await userEvent.type(screen.getByLabelText('6-digit code'), '123456')
    await userEvent.type(screen.getByLabelText('New password'), 'Brand@New1')
    await userEvent.click(screen.getByRole('button', { name: 'Update password' }))

    expect(await screen.findByRole('heading', { name: 'Password updated' })).toBeInTheDocument()
    expect(calls[1]?.body).toEqual({ identifier: '01999123456', code: '123456', newPassword: 'Brand@New1' })
  })

  it('says the code was emailed when an email is given', async () => {
    mockApi({ 'POST /auth/forgot-password': sent })
    renderPage(<ForgotPasswordPage />, { path: '/forgot-password' })

    await userEvent.type(screen.getByLabelText('Email or mobile number'), 'You@Example.com')
    await userEvent.click(screen.getByRole('button', { name: 'Send reset code' }))

    expect(await screen.findByText('Enter the 6-digit code we emailed to you@example.com.')).toBeInTheDocument()
  })

  it('rejects something that is neither an email nor a mobile number', async () => {
    const { calls } = mockApi({ 'POST /auth/forgot-password': sent })
    renderPage(<ForgotPasswordPage />, { path: '/forgot-password' })

    await userEvent.type(screen.getByLabelText('Email or mobile number'), '12345')
    await userEvent.click(screen.getByRole('button', { name: 'Send reset code' }))

    expect(await screen.findByText('Enter a valid email or mobile number (e.g. 017XXXXXXXX)')).toBeInTheDocument()
    expect(calls).toHaveLength(0)
  })

  it('lets the code be sent again only after a minute', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    const { calls } = mockApi({ 'POST /auth/forgot-password': sent })
    renderPage(<ForgotPasswordPage />, { path: '/forgot-password' })
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })

    await user.type(screen.getByLabelText('Email or mobile number'), '01999123456')
    await user.click(screen.getByRole('button', { name: 'Send reset code' }))
    expect(await screen.findByText('Send again in 60s')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Send the code again' })).not.toBeInTheDocument()

    for (let i = 0; i < 60; i++) await act(() => vi.advanceTimersByTime(1000))
    await user.click(screen.getByRole('button', { name: 'Send the code again' }))

    expect(await screen.findByText('A new code is on its way.')).toBeInTheDocument()
    expect(calls.filter((c) => c.path === '/auth/forgot-password')).toHaveLength(2)
  })

  it('can go back and use a different email or number', async () => {
    mockApi({ 'POST /auth/forgot-password': sent })
    renderPage(<ForgotPasswordPage />, { path: '/forgot-password' })

    await userEvent.type(screen.getByLabelText('Email or mobile number'), '01999123456')
    await userEvent.click(screen.getByRole('button', { name: 'Send reset code' }))
    await userEvent.click(await screen.findByRole('button', { name: 'Use a different email or number' }))

    expect(screen.getByLabelText('Email or mobile number')).toHaveValue('01999123456')
  })
})
