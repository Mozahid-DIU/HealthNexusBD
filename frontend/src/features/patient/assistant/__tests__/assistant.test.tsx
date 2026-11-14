import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { routes } from '@/app/routes'
import { i18n } from '@/i18n'
import { renderRoutes } from '@/test/render'
import { envelope, mockApi, type Call } from '@/test/mockApi'
import { useAuthStore } from '@/stores/auth'
import type { AuthUser } from '@/types/api'
import { FormattedText } from '../FormattedText'
import { looksLikeEmergency } from '../emergency'
import { turnsToSend, type ChatEntry } from '../useAssistantChat'

const USER: AuthUser = {
  id: 'u-p',
  email: 'nasrin@hn.bd',
  phone: '01810000007',
  role: 'patient',
  status: 'active',
  patient: { id: 'p1', uhid: 'BD-2026-01240', fullName: 'Nasrin Akter', bloodGroup: 'A-' },
}
const META = (total: number) => ({ total, page: 1, limit: 10 })
const REPORT = { id: 'lr1', testName: 'CBC', fileUrl: '', lab: 'PathCare', isVerified: true, uploadedAt: '2026-11-02T06:00:00Z' }
const RECORD = {
  id: 'r1', diagnosis: 'Type 1 Diabetes', content: '', symptoms: [], followUpDate: null,
  createdAt: '2026-11-01T05:00:00Z', doctor: null, prescriptions: [],
}
const reply = (text: string, extra: object = {}) => ({
  body: envelope({
    reply: text,
    sig: `sig:${text}`,
    emergency: false,
    medicineCaution: false,
    model: 'gemini-flash-lite-latest',
    attachment: null,
    ...extra,
  }),
})

function backend(chat: Parameters<typeof mockApi>[0][string] = reply('Hello!')) {
  return mockApi({
    'GET /auth/me': { body: envelope(USER) },
    'GET /consent/requests': { body: envelope({ pending: [], active: [] }) },
    'GET /patient/notifications': { body: envelope({ notifications: [], unreadCount: 0 }, META(0)) },
    'GET /patient/lab-reports': { body: envelope([REPORT], META(1)) },
    'GET /patient/records': { body: envelope([RECORD], META(1)) },
    'POST /assistant/chat': chat,
  })
}

const chatCalls = (calls: Call[]) => calls.filter((c) => c.path === '/assistant/chat')
const consentGiven = () => localStorage.setItem('healthnexus-assistant-consent:u-p', 'yes')

beforeEach(() => {
  vi.unstubAllGlobals()
  localStorage.clear()
  useAuthStore.getState().setAuth(USER, 'access', 'refresh')
})

afterEach(async () => {
  await i18n.changeLanguage('en')
})

describe('Health Assistant', () => {
  it('asks for informed agreement once, then remembers it', async () => {
    backend()
    const { unmount } = renderRoutes(routes, '/patient/assistant')

    expect(await screen.findByText(/This is an AI helper, not a doctor/)).toBeInTheDocument()
    expect(screen.getByText(/call 999/)).toBeInTheDocument()
    const start = screen.getByRole('button', { name: 'Start chatting' })
    expect(start).toBeDisabled()

    await userEvent.click(screen.getByLabelText(/I understand/))
    await userEvent.click(start)
    expect(await screen.findByText(/What would you like to know about your health/)).toBeInTheDocument()

    unmount()
    renderRoutes(routes, '/patient/assistant')
    expect(await screen.findByLabelText('Your question')).toBeInTheDocument()
  })

  it('sends a question with Enter and shows the formatted answer', async () => {
    consentGiven()
    const { calls } = backend(reply('Good choices:\n- **Brown rice**\n- Lentils (dal)'))
    renderRoutes(routes, '/patient/assistant')

    await userEvent.type(await screen.findByLabelText('Your question'), 'What should I eat?{Enter}')

    const log = await screen.findByRole('log')
    expect(await within(log).findByText('Brown rice')).toContainHTML('strong')
    expect(within(log).getByText('Lentils (dal)').tagName).toBe('LI')
    expect(chatCalls(calls)[0]?.body).toEqual({
      consent: true,
      lang: 'en',
      messages: [{ role: 'user', text: 'What should I eat?' }],
    })
  })

  it('breaks the line on Shift+Enter instead of sending', async () => {
    consentGiven()
    const { calls } = backend()
    renderRoutes(routes, '/patient/assistant')

    const input = await screen.findByLabelText('Your question')
    await userEvent.type(input, 'line one{Shift>}{Enter}{/Shift}line two')

    expect(input).toHaveValue('line one\nline two')
    expect(chatCalls(calls)).toHaveLength(0)
  })

  it('explains the latest lab report from the suggestion, sharing only that report', async () => {
    consentGiven()
    const { calls } = backend(reply('Your haemoglobin is normal.', { attachment: { kind: 'labReport', id: 'lr1', title: 'CBC' } }))
    renderRoutes(routes, '/patient/assistant')

    await userEvent.click(await screen.findByRole('button', { name: 'Explain my latest lab report' }))

    expect(await screen.findByText('Your haemoglobin is normal.')).toBeInTheDocument()
    expect(screen.getByText('Attached: CBC')).toBeInTheDocument()
    expect(screen.getByText('Shared: CBC')).toBeInTheDocument()
    expect(chatCalls(calls)[0]?.body).toMatchObject({ attachment: { kind: 'labReport', id: 'lr1' } })
  })

  it('attaches a chosen visit to the next question only', async () => {
    consentGiven()
    const { calls } = backend()
    renderRoutes(routes, '/patient/assistant')

    await userEvent.click(await screen.findByRole('button', { name: 'Attach a visit or lab report' }))
    const dialog = await screen.findByRole('dialog')
    await userEvent.click(await within(dialog).findByRole('button', { name: /Type 1 Diabetes/ }))
    expect(screen.getByText('Attached: Type 1 Diabetes')).toBeInTheDocument()

    await userEvent.type(screen.getByLabelText('Your question'), 'Explain this{Enter}')
    await screen.findByText('Hello!')
    await userEvent.type(screen.getByLabelText('Your question'), 'Thanks{Enter}')
    await waitFor(() => expect(chatCalls(calls)).toHaveLength(2))

    expect(chatCalls(calls)[0]?.body).toMatchObject({ attachment: { kind: 'record', id: 'r1' } })
    expect(chatCalls(calls)[1]?.body).not.toHaveProperty('attachment')
    expect(chatCalls(calls)[1]?.body).toMatchObject({
      messages: [
        { role: 'user', text: 'Explain this' },
        // The assistant's answer goes back with the server's signature.
        { role: 'model', text: 'Hello!', sig: 'sig:Hello!' },
        { role: 'user', text: 'Thanks' },
      ],
    })
  })

  it('puts a call-999 button above an emergency answer', async () => {
    consentGiven()
    backend(reply('Please get help now.', { emergency: true }))
    renderRoutes(routes, '/patient/assistant')

    await userEvent.type(await screen.findByLabelText('Your question'), 'I have chest pain{Enter}')

    expect(await screen.findByText('This may be an emergency')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Call 999' })).toHaveAttribute('href', 'tel:999')
  })

  it('still shows the 999 button when an emergency question could not be sent', async () => {
    consentGiven()
    backend({ status: 429, body: { success: false, data: null, error: 'Too many' } })
    renderRoutes(routes, '/patient/assistant')

    await userEvent.type(await screen.findByLabelText('Your question'), 'আমার বুকের ব্যথা হচ্ছে{Enter}')

    expect(await screen.findByRole('link', { name: 'Call 999' })).toHaveAttribute('href', 'tel:999')
  })

  it('adds a reminder under an answer that talks about doses', async () => {
    consentGiven()
    backend(reply('It is often taken as 500 mg twice a day.', { medicineCaution: true }))
    renderRoutes(routes, '/patient/assistant')

    await userEvent.type(await screen.findByLabelText('Your question'), 'How is Metformin taken?{Enter}')

    expect(await screen.findByText('Never start, stop or change a medicine or its dose without your doctor.')).toBeInTheDocument()
  })

  it('keeps an unanswered question and lets the patient try again', async () => {
    consentGiven()
    let busy = true
    const { calls } = backend(() =>
      busy
        ? { status: 503, body: { success: false, data: null, error: 'busy', code: 'AI_UNAVAILABLE' } }
        : reply('Now I can answer.'),
    )
    renderRoutes(routes, '/patient/assistant')

    await userEvent.type(await screen.findByLabelText('Your question'), 'What is HbA1c?{Enter}')
    expect(await screen.findByText(/The Health Assistant is busy right now/)).toBeInTheDocument()

    busy = false
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }))

    expect(await screen.findByText('Now I can answer.')).toBeInTheDocument()
    expect(chatCalls(calls)[1]?.body).toMatchObject({ messages: [{ role: 'user', text: 'What is HbA1c?' }] })
  })

  it('starts over with New chat', async () => {
    consentGiven()
    backend()
    renderRoutes(routes, '/patient/assistant')

    await userEvent.type(await screen.findByLabelText('Your question'), 'Hi{Enter}')
    await screen.findByText('Hello!')
    await userEvent.click(screen.getByRole('button', { name: 'New chat' }))

    expect(screen.queryByText('Hello!')).not.toBeInTheDocument()
    expect(screen.getByText(/What would you like to know about your health/)).toBeInTheDocument()
  })

  it('reads in Bangla and sends the Bangla language hint', async () => {
    consentGiven()
    await i18n.changeLanguage('bn')
    const { calls } = backend()
    renderRoutes(routes, '/patient/assistant')

    expect(await screen.findByRole('heading', { level: 1, name: /হেলথ অ্যাসিস্ট্যান্ট/ })).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'ডায়াবেটিস থাকলে কী খাওয়া উচিত?' }))

    await waitFor(() => expect(chatCalls(calls)).toHaveLength(1))
    expect(chatCalls(calls)[0]?.body).toMatchObject({ lang: 'bn', messages: [{ role: 'user', text: 'ডায়াবেটিস থাকলে কী খাওয়া উচিত?' }] })
  })
})

describe('FormattedText', () => {
  it('shows markup in a reply as plain text, never as HTML', () => {
    render(<FormattedText text={'<img src=x onerror=alert(1)> **safe**'} />)
    expect(document.querySelector('img')).toBeNull()
    expect(screen.getByText(/<img src=x/)).toBeInTheDocument()
  })

  it.each([
    ['English digits', 'Steps:\n1. Walk daily\n2. Less salt'],
    ['Bangla digits', 'ধাপ:\n১. প্রতিদিন হাঁটুন\n২। লবণ কম খান'],
  ])('turns numbered lines into an ordered list (%s)', (_label, text) => {
    render(<FormattedText text={text} />)
    expect(screen.getByRole('list').tagName).toBe('OL')
    expect(screen.getAllByRole('listitem')).toHaveLength(2)
  })
})

describe('turnsToSend', () => {
  const entry = (role: 'user' | 'model', text: string, extra: Partial<ChatEntry> = {}): ChatEntry => ({ id: text, role, text, ...extra })

  it('leaves out an earlier unanswered question', () => {
    const { turns } = turnsToSend([entry('user', 'lost', { failed: true }), entry('user', 'now')])
    expect(turns).toEqual([{ role: 'user', text: 'now' }])
  })

  it('drops the oldest turns of a long chat and always starts with the patient', () => {
    const long = Array.from({ length: 30 }, (_, i) => entry(i % 2 ? 'model' : 'user', `m${i}`))
    const { turns, trimmed } = turnsToSend([...long, entry('user', 'last')])
    expect(trimmed).toBe(true)
    expect(turns.length).toBeLessThanOrEqual(14)
    expect(turns[0]?.role).toBe('user')
    expect(turns[turns.length - 1]).toEqual({ role: 'user', text: 'last' })
  })
})

describe('client-side emergency check (mirrors the server list)', () => {
  it.each([
    'chest pain', 'বুকের ব্যথা করছে', 'buke onek betha', 'shas kosto', 'সাপে কেটেছে', 'I want to kill myself',
  ])('catches "%s"', (text) => {
    expect(looksLikeEmergency(text)).toBe(true)
  })

  it('lets an ordinary question through', () => {
    expect(looksLikeEmergency('What should I eat for breakfast?')).toBe(false)
  })
})
