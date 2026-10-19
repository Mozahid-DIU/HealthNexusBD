import jwt from 'jsonwebtoken'
import request from 'supertest'
import { beforeEach, describe, expect, it } from 'vitest'
import { createApp } from '../../src/app.ts'
import { prisma } from '../../src/config/prisma.ts'
import { resetDb } from '../helpers/db.ts'
import { TEST_PASSWORD, createPatient } from '../helpers/factories.ts'

const app = createApp()

const patientBody = {
  role: 'patient',
  fullName: 'Rahim Uddin',
  email: 'rahim@test.bd',
  phone: '01711111111',
  password: 'Secret@123',
  nid: '1990123456789',
}

beforeEach(resetDb)

describe('POST /api/auth/register', () => {
  it('registers a patient as active and issues a UHID and tokens', async () => {
    const res = await request(app).post('/api/auth/register').send(patientBody)

    expect(res.status).toBe(201)
    expect(res.body.data.user.status).toBe('active')
    expect(res.body.data.user.patient.uhid).toMatch(/^BD-\d{4}-\d{5}$/)
    expect(res.body.data.user).not.toHaveProperty('passwordHash')
    expect(res.body.data.accessToken).toEqual(expect.any(String))
    expect(res.body.data.refreshToken).toEqual(expect.any(String))
  })

  it('stores the password only as a bcrypt hash', async () => {
    await request(app).post('/api/auth/register').send(patientBody)

    const user = await prisma.user.findUniqueOrThrow({ where: { email: patientBody.email } })
    expect(user.passwordHash).not.toContain(patientBody.password)
    expect(user.passwordHash).toMatch(/^\$2[aby]\$/)
  })

  it('rejects a duplicate email with 409', async () => {
    await request(app).post('/api/auth/register').send(patientBody)
    const res = await request(app)
      .post('/api/auth/register')
      .send({ ...patientBody, phone: '01722222222', nid: '1990123456700' })

    expect(res.status).toBe(409)
  })

  it('rejects invalid input with 400', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ ...patientBody, phone: '12345', password: 'short' })

    expect(res.status).toBe(400)
    expect(res.body.success).toBe(false)
  })

  describe('doctor (BMDC registry check)', () => {
    const doctorBody = {
      role: 'doctor',
      fullName: 'Ignored Name',
      email: 'doc@test.bd',
      phone: '01733333333',
      password: 'Secret@123',
      bmdcNumber: 'A-11111',
    }

    it('rejects a BMDC number that is not in the registry', async () => {
      const res = await request(app).post('/api/auth/register').send(doctorBody)
      expect(res.status).toBe(400)
    })

    it('registers as pending, takes the name from the registry, and claims the number', async () => {
      await prisma.doctorRegistry.create({
        data: { bmdcNumber: 'A-11111', fullName: 'Dr. Registry Name', specialization: 'Cardiologist' },
      })

      const res = await request(app).post('/api/auth/register').send(doctorBody)

      expect(res.status).toBe(201)
      expect(res.body.data.user.status).toBe('pending')
      expect(res.body.data.user.doctor.fullName).toBe('Dr. Registry Name')
      const entry = await prisma.doctorRegistry.findUniqueOrThrow({ where: { bmdcNumber: 'A-11111' } })
      expect(entry.isClaimed).toBe(true)
    })

    it('refuses a BMDC number that is already claimed', async () => {
      await prisma.doctorRegistry.create({ data: { bmdcNumber: 'A-11111', fullName: 'Dr. X' } })
      await request(app).post('/api/auth/register').send(doctorBody)

      const res = await request(app)
        .post('/api/auth/register')
        .send({ ...doctorBody, email: 'doc2@test.bd', phone: '01744444444' })

      expect(res.status).toBe(409)
    })
  })
})

describe('POST /api/auth/login', () => {
  it('logs in by email and by phone', async () => {
    const { user } = await createPatient()

    const byEmail = await request(app)
      .post('/api/auth/login')
      .send({ identifier: user.email, password: TEST_PASSWORD })
    const byPhone = await request(app)
      .post('/api/auth/login')
      .send({ identifier: user.phone, password: TEST_PASSWORD })

    expect(byEmail.status).toBe(200)
    expect(byPhone.status).toBe(200)
    expect(byEmail.body.data.user.id).toBe(user.id)
  })

  it('gives the same 401 for a wrong password and an unknown user (no enumeration)', async () => {
    const { user } = await createPatient()

    const wrong = await request(app)
      .post('/api/auth/login')
      .send({ identifier: user.email, password: 'Wrong@1234' })
    const unknown = await request(app)
      .post('/api/auth/login')
      .send({ identifier: 'nobody@test.bd', password: 'Wrong@1234' })

    expect(wrong.status).toBe(401)
    expect(unknown.status).toBe(401)
    expect(wrong.body.error).toBe(unknown.body.error)
  })

  it('blocks a suspended account with 403', async () => {
    const { user } = await createPatient({ status: 'suspended' })

    const res = await request(app)
      .post('/api/auth/login')
      .send({ identifier: user.email, password: TEST_PASSWORD })

    expect(res.status).toBe(403)
    expect(res.body.error).toMatch(/suspended/)
  })

  it('writes a login audit entry', async () => {
    const { user } = await createPatient()

    await request(app).post('/api/auth/login').send({ identifier: user.email, password: TEST_PASSWORD })

    const entry = await prisma.auditLog.findFirst({ where: { actorUserId: user.id, action: 'login' } })
    expect(entry).not.toBeNull()
  })
})

describe('password reset', () => {
  it('gives the same answer for unknown emails (no enumeration)', async () => {
    const res = await request(app).post('/api/auth/forgot-password').send({ email: 'nobody@test.bd' })

    expect(res.status).toBe(200)
    expect(res.body.data).not.toHaveProperty('devOtp')
  })

  it('resets the password with the emailed code and logs out old sessions', async () => {
    const { user } = await createPatient()
    const login = await request(app)
      .post('/api/auth/login')
      .send({ identifier: user.email, password: TEST_PASSWORD })
    const { devOtp } = (await request(app).post('/api/auth/forgot-password').send({ email: user.email })).body.data

    const res = await request(app)
      .post('/api/auth/reset-password')
      .send({ email: user.email, code: devOtp, newPassword: 'Brand@New1' })

    expect(res.status).toBe(200)
    const newLogin = await request(app)
      .post('/api/auth/login')
      .send({ identifier: user.email, password: 'Brand@New1' })
    expect(newLogin.status).toBe(200)
    const oldRefresh = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken: login.body.data.refreshToken })
    expect(oldRefresh.status).toBe(401)
  })

  it('rejects a wrong code, an unknown email, and a reused code', async () => {
    const { user } = await createPatient()
    const { devOtp } = (await request(app).post('/api/auth/forgot-password').send({ email: user.email })).body.data
    const wrong = devOtp === '000000' ? '111111' : '000000'
    const reset = (email: string, code: string) =>
      request(app).post('/api/auth/reset-password').send({ email, code, newPassword: 'Brand@New1' })

    expect((await reset(user.email, wrong)).status).toBe(400)
    expect((await reset('nobody@test.bd', devOtp)).status).toBe(400)
    expect((await reset(user.email, devOtp)).status).toBe(200)
    expect((await reset(user.email, devOtp)).status).toBe(400)
  })

  it('rejects an expired code', async () => {
    const { user } = await createPatient()
    const { devOtp } = (await request(app).post('/api/auth/forgot-password').send({ email: user.email })).body.data
    await prisma.passwordResetToken.updateMany({
      where: { userId: user.id },
      data: { expiresAt: new Date(Date.now() - 1000) },
    })

    const res = await request(app)
      .post('/api/auth/reset-password')
      .send({ email: user.email, code: devOtp, newPassword: 'Brand@New1' })

    expect(res.status).toBe(400)
  })
})

describe('session tokens', () => {
  async function loginTokens() {
    const { user } = await createPatient()
    const res = await request(app)
      .post('/api/auth/login')
      .send({ identifier: user.email, password: TEST_PASSWORD })
    return { user, ...(res.body.data as { accessToken: string; refreshToken: string }) }
  }

  it('GET /me requires a token', async () => {
    expect((await request(app).get('/api/auth/me')).status).toBe(401)
    expect(
      (await request(app).get('/api/auth/me').set('Authorization', 'Bearer not-a-jwt')).status,
    ).toBe(401)
  })

  it('rejects a tampered, an expired, and a refresh token on protected routes', async () => {
    const { user, accessToken, refreshToken } = await loginTokens()
    const [h, p, sig] = accessToken.split('.')
    const tampered = `${h}.${p}.${(sig[0] === 'A' ? 'B' : 'A') + sig.slice(1)}`
    const expired = jwt.sign({ sub: user.id, role: 'patient' }, process.env.JWT_ACCESS_SECRET!, { expiresIn: -10 })

    for (const token of [tampered, expired, refreshToken]) {
      const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`)
      expect(res.status).toBe(401)
    }
  })

  it('does not accept an access token as a refresh token', async () => {
    const { accessToken } = await loginTokens()
    expect((await request(app).post('/api/auth/refresh').send({ refreshToken: accessToken })).status).toBe(401)
  })

  it('GET /me returns the logged-in profile', async () => {
    const { user, accessToken } = await loginTokens()

    const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${accessToken}`)

    expect(res.status).toBe(200)
    expect(res.body.data.id).toBe(user.id)
  })

  it('refresh issues a new access token', async () => {
    const { refreshToken } = await loginTokens()

    const res = await request(app).post('/api/auth/refresh').send({ refreshToken })

    expect(res.status).toBe(200)
    expect(res.body.data.accessToken).toEqual(expect.any(String))
  })

  it('logout invalidates existing refresh tokens', async () => {
    const { accessToken, refreshToken } = await loginTokens()

    const out = await request(app).post('/api/auth/logout').set('Authorization', `Bearer ${accessToken}`)
    const res = await request(app).post('/api/auth/refresh').send({ refreshToken })

    expect(out.status).toBe(200)
    expect(res.status).toBe(401)
  })
})
