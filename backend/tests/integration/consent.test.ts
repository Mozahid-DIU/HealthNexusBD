import request from 'supertest'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp } from '../../src/app.ts'
import { env } from '../../src/config/env.ts'
import { prisma } from '../../src/config/prisma.ts'
import { resetDb } from '../helpers/db.ts'
import { createDoctor, createPatient } from '../helpers/factories.ts'

const app = createApp()

type Doctor = Awaited<ReturnType<typeof createDoctor>>
type Patient = Awaited<ReturnType<typeof createPatient>>

let doctor: Doctor
let patient: Patient

beforeEach(async () => {
  await resetDb()
  doctor = await createDoctor()
  patient = await createPatient()
})

async function requestAccess() {
  const res = await request(app)
    .post('/api/consent/request')
    .set('Authorization', doctor.auth)
    .send({ uhid: patient.patient.uhid, reason: 'Follow-up consultation' })
  expect(res.status).toBe(201)
  return res.body.data as { requestId: string; devOtp: string }
}

const verify = (requestId: string, code: string) =>
  request(app).post('/api/consent/verify').set('Authorization', doctor.auth).send({ requestId, code })

const readRecords = () =>
  request(app).get(`/api/doctor/patients/${patient.patient.id}/records`).set('Authorization', doctor.auth)

const wrongCode = (otp: string) => (otp === '000000' ? '111111' : '000000')

describe('consent + OTP flow', () => {
  it('blocks the doctor from records until the patient shares the OTP', async () => {
    expect((await readRecords()).status).toBe(403)

    const { requestId, devOtp } = await requestAccess()
    const res = await verify(requestId, devOtp)

    expect(res.status).toBe(201)
    expect(res.body.data.sessionId).toEqual(expect.any(String))
    expect((await readRecords()).status).toBe(200)
  })

  it('stores only a hash of the OTP', async () => {
    const { requestId, devOtp } = await requestAccess()

    const token = await prisma.otpToken.findUniqueOrThrow({ where: { id: requestId } })
    expect(JSON.stringify(token)).not.toContain(devOtp)
  })

  it('shows the pending request to the patient', async () => {
    await requestAccess()

    const res = await request(app).get('/api/consent/requests').set('Authorization', patient.auth)

    expect(res.status).toBe(200)
    expect(res.body.data.pendingRequests).toHaveLength(1)
    expect(res.body.data.pendingRequests[0].reason).toBe('Follow-up consultation')
  })

  it('rejects a wrong code and counts down the remaining attempts', async () => {
    const { requestId, devOtp } = await requestAccess()

    const res = await verify(requestId, wrongCode(devOtp))

    expect(res.status).toBe(400)
    expect(res.body.error).toMatch(/4 attempt/)
  })

  it('locks the request after too many wrong codes, even for the right code', async () => {
    const { requestId, devOtp } = await requestAccess()
    for (let i = 0; i < 5; i++) await verify(requestId, wrongCode(devOtp))

    const res = await verify(requestId, devOtp)

    expect(res.status).toBe(429)
  })

  it('rejects an expired OTP', async () => {
    const { requestId, devOtp } = await requestAccess()
    await prisma.otpToken.update({ where: { id: requestId }, data: { expiresAt: new Date(Date.now() - 1000) } })

    const res = await verify(requestId, devOtp)

    expect(res.status).toBe(400)
    expect((await readRecords()).status).toBe(403)
  })

  it('binds the OTP to the doctor who requested it', async () => {
    const { requestId, devOtp } = await requestAccess()
    const other = await createDoctor()

    const res = await request(app)
      .post('/api/consent/verify')
      .set('Authorization', other.auth)
      .send({ requestId, code: devOtp })

    expect(res.status).toBe(404)
    expect(await prisma.accessSession.count()).toBe(0)
  })

  it('lets the patient deny a request so its code no longer works', async () => {
    const { requestId, devOtp } = await requestAccess()

    const deny = await request(app)
      .post(`/api/consent/requests/${requestId}/deny`)
      .set('Authorization', patient.auth)

    expect(deny.status).toBe(200)
    expect((await verify(requestId, devOtp)).status).toBe(400)
    expect(await prisma.accessSession.count()).toBe(0)
  })

  it('accepts each OTP only once', async () => {
    const { requestId, devOtp } = await requestAccess()
    await verify(requestId, devOtp)

    expect((await verify(requestId, devOtp)).status).toBe(400)
    expect(await prisma.accessSession.count()).toBe(1)
  })

  it('cuts off access as soon as the patient revokes the session', async () => {
    const { requestId, devOtp } = await requestAccess()
    const { sessionId } = (await verify(requestId, devOtp)).body.data

    const rev = await request(app)
      .post(`/api/consent/sessions/${sessionId}/revoke`)
      .set('Authorization', patient.auth)

    expect(rev.status).toBe(200)
    expect((await readRecords()).status).toBe(403)
  })

  it('cuts off access when the session time runs out', async () => {
    const { requestId, devOtp } = await requestAccess()
    const { sessionId } = (await verify(requestId, devOtp)).body.data
    await prisma.accessSession.update({
      where: { id: sessionId },
      data: { expiresAt: new Date(Date.now() - 1000) },
    })

    expect((await readRecords()).status).toBe(403)
  })

  it('audits the grant and the doctor reading records', async () => {
    const { requestId, devOtp } = await requestAccess()
    await verify(requestId, devOtp)
    await readRecords()

    const actions = await prisma.auditLog.findMany({
      where: { actorUserId: doctor.user.id, patientId: patient.patient.id },
      select: { action: true },
    })
    expect(actions.map((a) => a.action)).toEqual(expect.arrayContaining(['grant', 'view']))
  })

  it('does not let an unverified (pending) doctor request access', async () => {
    const pending = await createDoctor({ status: 'pending' })

    const res = await request(app)
      .post('/api/consent/request')
      .set('Authorization', pending.auth)
      .send({ uhid: patient.patient.uhid })

    expect(res.status).toBe(403)
  })

  describe('cross-patient isolation', () => {
    it('a session for one patient does not open another patient', async () => {
      const { requestId, devOtp } = await requestAccess()
      await verify(requestId, devOtp)
      const other = await createPatient()

      const res = await request(app)
        .get(`/api/doctor/patients/${other.patient.id}/records`)
        .set('Authorization', doctor.auth)

      expect(res.status).toBe(403)
    })

    it("a patient cannot revoke another patient's session", async () => {
      const { requestId, devOtp } = await requestAccess()
      const { sessionId } = (await verify(requestId, devOtp)).body.data
      const other = await createPatient()

      const res = await request(app)
        .post(`/api/consent/sessions/${sessionId}/revoke`)
        .set('Authorization', other.auth)

      expect(res.status).toBe(404)
      expect((await readRecords()).status).toBe(200)
    })

    it("a patient cannot deny another patient's request", async () => {
      const { requestId, devOtp } = await requestAccess()
      const other = await createPatient()

      const res = await request(app)
        .post(`/api/consent/requests/${requestId}/deny`)
        .set('Authorization', other.auth)

      expect(res.status).toBe(404)
      expect((await verify(requestId, devOtp)).status).toBe(201)
    })
  })
})

describe('consent code by real SMS', () => {
  const realMode = { OTP_MODE: 'real', SMS_API_KEY: 'test-key', SMS_SENDER_ID: '8809617000000' } as const
  const saved = { OTP_MODE: env.OTP_MODE, SMS_API_KEY: env.SMS_API_KEY, SMS_SENDER_ID: env.SMS_SENDER_ID }

  beforeEach(() => {
    Object.assign(env, realMode)
  })
  afterEach(() => {
    Object.assign(env, saved)
    vi.unstubAllGlobals()
  })

  const ask = () =>
    request(app)
      .post('/api/consent/request')
      .set('Authorization', doctor.auth)
      .send({ uhid: patient.patient.uhid, reason: 'Follow-up consultation' })

  it("texts the code to the patient's phone and never shows it to the doctor", async () => {
    const gateway = vi.fn(async () => new Response(JSON.stringify({ response_code: 202 })))
    vi.stubGlobal('fetch', gateway)

    const res = await ask()

    expect(res.status).toBe(201)
    expect(res.body.data).toMatchObject({ otpMode: 'real', smsSent: true })
    expect(res.body.data).not.toHaveProperty('devOtp')
    const sent = new URLSearchParams(String((gateway.mock.calls[0] as unknown as [string, RequestInit])[1].body))
    expect(sent.get('number')).toBe(patient.user.phone)
  })

  it('withdraws the request and says so when the SMS cannot be sent', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ response_code: 1007 }))))

    const res = await ask()

    expect(res.status).toBe(503)
    expect(res.body.code).toBe('SMS_UNAVAILABLE')
    expect(await prisma.otpToken.count({ where: { isUsed: false } })).toBe(0)
  })

  it('shows the code for a seeded demo patient, whose made-up number is never texted', async () => {
    const gateway = vi.fn()
    vi.stubGlobal('fetch', gateway)
    await prisma.user.update({ where: { id: patient.user.id }, data: { phone: '01810000002' } })

    const res = await ask()

    expect(res.status).toBe(201)
    expect(res.body.data).toMatchObject({ otpMode: 'demo', smsSent: false, devOtp: expect.stringMatching(/^\d{6}$/) })
    expect(gateway).not.toHaveBeenCalled()
  })
})

describe('consent request limits', () => {
  it('lets a doctor text the same patient a new code at most once a minute', async () => {
    await requestAccess()

    const again = await request(app)
      .post('/api/consent/request')
      .set('Authorization', doctor.auth)
      .send({ uhid: patient.patient.uhid })
    expect(again.status).toBe(429)

    await prisma.otpToken.updateMany({ data: { createdAt: new Date(Date.now() - 61_000) } })
    await requestAccess()
  })

  it('caps code guesses at five even when they arrive at once', async () => {
    const { requestId, devOtp } = await requestAccess()

    const results = await Promise.all(Array.from({ length: 8 }, () => verify(requestId, wrongCode(devOtp))))

    expect(results.filter((r) => r.status === 400)).toHaveLength(5)
    expect(results.filter((r) => r.status === 429)).toHaveLength(3)
    expect((await verify(requestId, devOtp)).status).toBe(429)
  })

  it("in production never shows a real patient's code, even if OTP_MODE is left on demo", async () => {
    const nodeEnv = env.NODE_ENV
    env.NODE_ENV = 'production'
    try {
      const res = await request(app)
        .post('/api/consent/request')
        .set('Authorization', doctor.auth)
        .send({ uhid: patient.patient.uhid })
      expect(res.status).toBe(201)
      expect(res.body.data).not.toHaveProperty('devOtp')

      // A seeded demo patient's made-up number is never texted, so the code is shown.
      const demo = await createPatient()
      await prisma.user.update({ where: { id: demo.user.id }, data: { phone: '01810000003' } })
      const shown = await request(app)
        .post('/api/consent/request')
        .set('Authorization', doctor.auth)
        .send({ uhid: demo.patient.uhid })
      expect(shown.body.data.devOtp).toMatch(/^\d{6}$/)
    } finally {
      env.NODE_ENV = nodeEnv
    }
  })
})
