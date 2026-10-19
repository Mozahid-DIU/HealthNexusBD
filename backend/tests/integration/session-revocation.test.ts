import jwt from 'jsonwebtoken'
import request from 'supertest'
import { beforeEach, describe, expect, it } from 'vitest'
import { createApp } from '../../src/app.ts'
import { prisma } from '../../src/config/prisma.ts'
import { withAuditPurge } from '../../prisma/audit-purge.ts'
import { resetDb } from '../helpers/db.ts'
import { TEST_PASSWORD, createAdmin, createDoctor, createLab, createPatient } from '../helpers/factories.ts'

const app = createApp()
let admin: Awaited<ReturnType<typeof createAdmin>>

beforeEach(async () => {
  await resetDb()
  admin = await createAdmin()
})

/** Log in for real, so the tokens are exactly what a browser would hold. */
async function login(identifier: string) {
  const res = await request(app).post('/api/auth/login').send({ identifier, password: TEST_PASSWORD })
  expect(res.status).toBe(200)
  return res.body.data as { accessToken: string; refreshToken: string }
}

const me = (accessToken: string) => request(app).get('/api/auth/me').set('Authorization', `Bearer ${accessToken}`)

const suspend = (userId: string, value: boolean) =>
  request(app).post(`/api/admin/users/${userId}/suspend`).set('Authorization', admin.auth).send({ suspend: value })

describe('suspending a user takes effect immediately', () => {
  it('rejects the suspended user’s current access token on the very next request', async () => {
    const { user } = await createPatient()
    const { accessToken } = await login(user.email)
    expect((await me(accessToken)).status).toBe(200)

    expect((await suspend(user.id, true)).status).toBe(200)

    const res = await request(app).get('/api/patient/profile').set('Authorization', `Bearer ${accessToken}`)
    expect(res.status).toBe(401)
  })

  it('also invalidates the refresh token', async () => {
    const { user } = await createPatient()
    const { refreshToken } = await login(user.email)

    await suspend(user.id, true)

    const res = await request(app).post('/api/auth/refresh').send({ refreshToken })
    expect(res.status).toBe(403)
  })

  it('keeps old tokens dead after the user is reinstated, but a fresh login works', async () => {
    const { user } = await createPatient()
    const old = await login(user.email)

    await suspend(user.id, true)
    await suspend(user.id, false)

    expect((await me(old.accessToken)).status).toBe(401)
    expect((await request(app).post('/api/auth/refresh').send({ refreshToken: old.refreshToken })).status).toBe(401)
    const fresh = await login(user.email)
    expect((await me(fresh.accessToken)).status).toBe(200)
  })

  it('cuts off a doctor the moment they are rejected', async () => {
    const { user, doctor } = await createDoctor()
    const { accessToken } = await login(user.email)

    await request(app)
      .post(`/api/admin/doctors/${doctor.id}/reject`)
      .set('Authorization', admin.auth)
      .send({ reason: 'BMDC licence revoked' })

    expect((await me(accessToken)).status).toBe(401)
  })

  it('cuts off a lab the moment it is rejected', async () => {
    const { user, lab } = await createLab()
    const { accessToken } = await login(user.email)

    await request(app)
      .post(`/api/admin/labs/${lab.id}/reject`)
      .set('Authorization', admin.auth)
      .send({ reason: 'Licence expired' })

    expect((await me(accessToken)).status).toBe(401)
  })

  it('blocks a suspended account even if its token version still matches', async () => {
    const { user } = await createPatient()
    const { accessToken } = await login(user.email)

    // Simulates a status change made outside the admin API (e.g. directly in the DB).
    await prisma.user.update({ where: { id: user.id }, data: { status: 'suspended' } })

    const res = await me(accessToken)
    expect(res.status).toBe(403)
    expect(res.body.error).toMatch(/suspended/)
  })
})

describe('other session-ending events also kill the access token at once', () => {
  it('logout', async () => {
    const { user } = await createPatient()
    const { accessToken } = await login(user.email)

    await request(app).post('/api/auth/logout').set('Authorization', `Bearer ${accessToken}`)

    expect((await me(accessToken)).status).toBe(401)
  })

  it('password reset', async () => {
    const { user } = await createPatient()
    const { accessToken } = await login(user.email)
    const { devOtp } = (await request(app).post('/api/auth/forgot-password').send({ email: user.email })).body.data

    await request(app)
      .post('/api/auth/reset-password')
      .send({ email: user.email, code: devOtp, newPassword: 'Brand@New1' })

    expect((await me(accessToken)).status).toBe(401)
  })

  it('a deleted user', async () => {
    const { user } = await createPatient()
    const { accessToken } = await login(user.email)

    // Its login audit row would block the delete (FK RESTRICT); clear it via the dev purge.
    await withAuditPurge(prisma, async (tx) => {
      await tx.auditLog.deleteMany({ where: { actorUserId: user.id } })
      await tx.user.delete({ where: { id: user.id } })
    })

    expect((await me(accessToken)).status).toBe(401)
  })
})

describe('tokens issued before this change (no version claim)', () => {
  it('are refused once, then the client can silently refresh', async () => {
    const { user } = await createPatient()
    const { refreshToken } = await login(user.email)
    const legacy = jwt.sign({ sub: user.id, role: 'patient' }, process.env.JWT_ACCESS_SECRET!, { expiresIn: '15m' })

    expect((await me(legacy)).status).toBe(401)
    const { accessToken } = (await request(app).post('/api/auth/refresh').send({ refreshToken })).body.data
    expect((await me(accessToken)).status).toBe(200)
  })
})

describe('tokens stay valid when nothing changed', () => {
  it('a pending doctor still authenticates and gets the service-level 403', async () => {
    const { user } = await createDoctor({ status: 'pending' })
    const { accessToken } = await login(user.email)

    expect((await me(accessToken)).status).toBe(200)
    const res = await request(app).get('/api/doctor/patients').set('Authorization', `Bearer ${accessToken}`)
    expect(res.status).toBe(403)
    expect(res.body.error).toMatch(/pending/)
  })

  it('lets other users keep working while one user is suspended', async () => {
    const a = await createPatient()
    const b = await createPatient()
    const tokenB = (await login(b.user.email)).accessToken

    await suspend(a.user.id, true)

    expect((await me(tokenB)).status).toBe(200)
  })

  it('a refreshed access token works', async () => {
    const { user } = await createPatient()
    const { refreshToken } = await login(user.email)

    const { accessToken } = (await request(app).post('/api/auth/refresh').send({ refreshToken })).body.data

    expect((await me(accessToken)).status).toBe(200)
  })
})
