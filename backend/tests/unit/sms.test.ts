import { readFileSync } from 'node:fs'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { env } from '../../src/config/env.ts'
import { DEMO_PHONE_NUMBERS, isDemoNumber } from '../../src/config/demoNumbers.ts'
import { maskPhone, resetSmsBudget, sendOtpSms, sendSms, SmsError } from '../../src/services/sms.ts'

const REAL_NUMBER = '01999000111'
const saved = { ...env }

function gateway(body: unknown, status = 200) {
  const fetchMock = vi.fn(async () => new Response(typeof body === 'string' ? body : JSON.stringify(body), { status }))
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

beforeEach(() => {
  resetSmsBudget()
  Object.assign(env, {
    OTP_MODE: 'real',
    SMS_API_KEY: 'test-key',
    SMS_SENDER_ID: '8809617000000',
    SMS_API_URL: 'https://bulksmsbd.net/api/smsapi',
  })
})

afterEach(() => {
  Object.assign(env, saved)
  vi.unstubAllGlobals()
})

describe('sendSms', () => {
  it('sends a real SMS through BulkSMSBD and confirms the gateway accepted it', async () => {
    const fetchMock = gateway({ response_code: 202, success_message: 'SMS Submitted Successfully' })

    const result = await sendSms(REAL_NUMBER, 'HealthNexus BD: hello', 'test')

    expect(result).toEqual({ delivered: true, mode: 'real' })
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit]
    expect(url).toBe('https://bulksmsbd.net/api/smsapi')
    const body = new URLSearchParams(String(init.body))
    expect(Object.fromEntries(body)).toMatchObject({
      api_key: 'test-key',
      senderid: '8809617000000',
      number: REAL_NUMBER,
      message: 'HealthNexus BD: hello',
    })
  })

  it.each([
    [1007, /balance/i],
    [1032, /IP/i],
    [1001, /number/i],
  ])('fails when the gateway answers HTTP 200 with error code %i', async (code, reason) => {
    gateway({ response_code: code, error_message: 'nope' })

    const error = await sendSms(REAL_NUMBER, 'hi', 'test').catch((e: unknown) => e)

    expect(error).toBeInstanceOf(SmsError)
    expect((error as SmsError).gatewayCode).toBe(code)
    expect((error as SmsError).message).toMatch(reason)
  })

  it('fails on an unreadable answer or a network error', async () => {
    gateway('<html>bad gateway</html>')
    await expect(sendSms(REAL_NUMBER, 'hi', 'test')).rejects.toBeInstanceOf(SmsError)

    vi.stubGlobal('fetch', vi.fn(async () => { throw new TypeError('fetch failed') }))
    await expect(sendSms(REAL_NUMBER, 'hi', 'test')).rejects.toBeInstanceOf(SmsError)
  })

  it('never texts a seeded demo number, even in real mode', async () => {
    const fetchMock = gateway({ response_code: 202 })

    const result = await sendSms('01810000002', 'hi', 'test')

    expect(result).toEqual({ delivered: false, mode: 'demo' })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('sends nothing in demo mode', async () => {
    env.OTP_MODE = 'demo'
    const fetchMock = gateway({ response_code: 202 })

    expect(await sendOtpSms(REAL_NUMBER, '123456')).toEqual({ delivered: false, mode: 'demo' })
    expect(fetchMock).not.toHaveBeenCalled()
  })
})

describe('SMS safety limits', () => {
  it('stops sending real SMS for the day once the daily limit is reached', async () => {
    env.SMS_DAILY_LIMIT = 2
    const fetchMock = gateway({ response_code: 202 })

    await sendSms(REAL_NUMBER, 'one', 'test')
    await sendSms(REAL_NUMBER, 'two', 'test')
    const third = await sendSms(REAL_NUMBER, 'three', 'test').catch((e: unknown) => e)

    expect(third).toBeInstanceOf(SmsError)
    expect((third as SmsError).message).toMatch(/daily SMS limit/)
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('masks phone numbers for the logs', () => {
    expect(maskPhone('01999123456')).toBe('019*****456')
  })
})

describe('demo phone numbers', () => {
  it("cover every made-up number in the seed (the owner's real one comes from .env)", () => {
    const seed = readFileSync(new URL('../../prisma/seed.ts', import.meta.url), 'utf8')
    const seeded = [...seed.matchAll(/phone: '(01\d{9})'/g)].map((m) => m[1]!)

    expect(seeded.length).toBeGreaterThan(15)
    expect(seeded.filter((p) => !isDemoNumber(p))).toEqual([])
    expect(isDemoNumber('01999123456')).toBe(false)
    // Nothing stale: every listed number still belongs to a seeded account.
    expect([...DEMO_PHONE_NUMBERS].every((p) => seeded.includes(p))).toBe(true)
  })
})
