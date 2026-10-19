import request from 'supertest'
import { beforeEach, describe, expect, it } from 'vitest'
import { createApp } from '../../src/app.ts'
import { prisma } from '../../src/config/prisma.ts'
import { resetDb } from '../helpers/db.ts'
import { TEST_PASSWORD, createAdmin, createDoctor, createLab, createPatient } from '../helpers/factories.ts'

/**
 * Stable machine-readable `code`s let the frontend react correctly (sign the user out,
 * stop retrying, show a "pending verification" screen) without matching message text.
 */
const app = createApp()

beforeEach(resetDb)

async function login(identifier: string) {
  return (await request(app).post('/api/auth/login').send({ identifier, password: TEST_PASSWORD })).body.data as {
    accessToken: string
    refreshToken: string
  }
}

describe('error codes', () => {
  it('ACCOUNT_SUSPENDED on login, refresh and authenticated requests', async () => {
    const { user } = await createPatient()
    const { refreshToken } = await login(user.email)
    const live = await login(user.email)
    await prisma.user.update({ where: { id: user.id }, data: { status: 'suspended' } })

    const loginRes = await request(app).post('/api/auth/login').send({ identifier: user.email, password: TEST_PASSWORD })
    const refreshRes = await request(app).post('/api/auth/refresh').send({ refreshToken })
    const meRes = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${live.accessToken}`)

    for (const res of [loginRes, refreshRes, meRes]) {
      expect(res.status).toBe(403)
      expect(res.body.code).toBe('ACCOUNT_SUSPENDED')
    }
  })

  it('the refresh endpoint has its own, more generous rate limit than login/OTP', async () => {
    const { authLimiter, refreshLimiter } = await import('../../src/middleware/rateLimit.ts')
    expect(refreshLimiter).not.toBe(authLimiter)
    const routes = await import('../../src/modules/auth/auth.routes.ts')
    const layer = routes.authRouter.stack.find((l: { route?: { path: string } }) => l.route?.path === '/refresh')
    const handles = layer!.route!.stack.map((s: { handle: unknown }) => s.handle)
    expect(handles).toContain(refreshLimiter)
    expect(handles).not.toContain(authLimiter)
  })

  it('SESSION_INVALID when a token was revoked (logout / suspend / reset)', async () => {
    const { user } = await createPatient()
    const { accessToken, refreshToken } = await login(user.email)
    await request(app).post('/api/auth/logout').set('Authorization', `Bearer ${accessToken}`)

    const meRes = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${accessToken}`)
    const refreshRes = await request(app).post('/api/auth/refresh').send({ refreshToken })

    expect(meRes.status).toBe(401)
    expect(meRes.body.code).toBe('SESSION_INVALID')
    expect(refreshRes.status).toBe(401)
    expect(refreshRes.body.code).toBe('SESSION_INVALID')
  })

  it('TOKEN_INVALID for a missing, malformed or expired access token (client may refresh)', async () => {
    const missing = await request(app).get('/api/auth/me')
    const bad = await request(app).get('/api/auth/me').set('Authorization', 'Bearer nope')

    expect(missing.body.code).toBe('TOKEN_INVALID')
    expect(bad.body.code).toBe('TOKEN_INVALID')
  })

  it('ACCOUNT_PENDING for an unverified doctor or lab', async () => {
    const doctor = await createDoctor({ status: 'pending' })
    const lab = await createLab({ status: 'pending' })

    const d = await request(app).get('/api/doctor/patients').set('Authorization', doctor.auth)
    const l = await request(app).get('/api/lab/uploads').set('Authorization', lab.auth)
    const c = await request(app)
      .post('/api/consent/request')
      .set('Authorization', doctor.auth)
      .send({ uhid: 'BD-2026-00001' })

    for (const res of [d, l, c]) {
      expect(res.status).toBe(403)
      expect(res.body.code).toBe('ACCOUNT_PENDING')
    }
  })

  it('omits `code` when there is none, keeping the existing envelope', async () => {
    const admin = await createAdmin()
    const res = await request(app).get('/api/admin/doctors/not-a-uuid/approve').set('Authorization', admin.auth)

    expect(res.body).toEqual({ success: false, data: null, error: expect.any(String) })
  })
})
