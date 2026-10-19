import request from 'supertest'
import { beforeEach, describe, expect, it } from 'vitest'
import { createApp } from '../../src/app.ts'
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
