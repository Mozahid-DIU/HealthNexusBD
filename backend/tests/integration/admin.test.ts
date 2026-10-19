import request from 'supertest'
import { beforeEach, describe, expect, it } from 'vitest'
import { createApp } from '../../src/app.ts'
import { prisma } from '../../src/config/prisma.ts'
import { resetDb } from '../helpers/db.ts'
import { createAdmin, createDoctor, createLab, createPatient } from '../helpers/factories.ts'

const app = createApp()
let admin: Awaited<ReturnType<typeof createAdmin>>

beforeEach(async () => {
  await resetDb()
  admin = await createAdmin()
})

const get = (path: string) => request(app).get(path).set('Authorization', admin.auth)
const post = (path: string, body: object = {}) => request(app).post(path).set('Authorization', admin.auth).send(body)

describe('dashboard', () => {
  it('counts real platform data', async () => {
    await createPatient()
    await createPatient({ status: 'suspended' })
    await createDoctor()
    await createDoctor({ status: 'pending' })
    await createLab({ status: 'pending' })

    const res = await get('/api/admin/dashboard')

    expect(res.status).toBe(200)
    expect(res.body.data).toMatchObject({
      users: { patients: 2, doctors: 2, labs: 1, total: 5 },
      pending: { doctors: 1, labs: 1 },
      suspended: 1,
      activeSessions: 0,
      clinical: { records: 0, labReports: 0 },
    })
  })
})

describe('doctor verification', () => {
  it('lists pending doctors and approves one', async () => {
    const { doctor, user } = await createDoctor({ status: 'pending' })

    const queue = await get('/api/admin/doctors?status=pending')
    const res = await post(`/api/admin/doctors/${doctor.id}/approve`)

    expect(queue.body.data.map((d: { id: string }) => d.id)).toContain(doctor.id)
    expect(res.status).toBe(200)
    expect((await prisma.user.findUniqueOrThrow({ where: { id: user.id } })).status).toBe('active')
  })

  it('refuses to approve twice', async () => {
    const { doctor } = await createDoctor({ status: 'pending' })
    await post(`/api/admin/doctors/${doctor.id}/approve`)

    expect((await post(`/api/admin/doctors/${doctor.id}/approve`)).status).toBe(409)
  })

  it('rejects a doctor with a reason and audits it', async () => {
    const { doctor, user } = await createDoctor({ status: 'pending' })

    const res = await post(`/api/admin/doctors/${doctor.id}/reject`, { reason: 'BMDC number mismatch' })

    expect(res.status).toBe(200)
    expect((await prisma.user.findUniqueOrThrow({ where: { id: user.id } })).status).toBe('suspended')
    const entry = await prisma.auditLog.findFirst({ where: { resource: { contains: `doctor_rejected:${doctor.id}` } } })
    expect(entry).not.toBeNull()
  })

  it('requires a reason to reject, and 404s an unknown doctor', async () => {
    const { doctor } = await createDoctor({ status: 'pending' })

    expect((await post(`/api/admin/doctors/${doctor.id}/reject`, {})).status).toBe(400)
    expect((await post('/api/admin/doctors/00000000-0000-0000-0000-000000000000/approve')).status).toBe(404)
  })
})

describe('lab verification', () => {
  it('approves and rejects labs', async () => {
    const a = await createLab({ status: 'pending' })
    const b = await createLab({ status: 'pending' })

    const queue = await get('/api/admin/labs?status=pending')
    const ok = await post(`/api/admin/labs/${a.lab.id}/approve`)
    const no = await post(`/api/admin/labs/${b.lab.id}/reject`, { reason: 'Licence expired' })

    expect(queue.body.data).toHaveLength(2)
    expect(ok.status).toBe(200)
    expect(no.status).toBe(200)
    expect((await prisma.diagnosticLab.findUniqueOrThrow({ where: { id: a.lab.id } })).isApproved).toBe(true)
    expect((await post(`/api/admin/labs/${b.lab.id}/reject`, { reason: 'again' })).status).toBe(409)
  })
})

describe('user management', () => {
  it('lists users filtered by role', async () => {
    await createPatient()
    await createDoctor()

    const res = await get('/api/admin/users?role=patient')

    expect(res.status).toBe(200)
    expect(res.body.data.every((u: { role: string }) => u.role === 'patient')).toBe(true)
    expect(res.body.meta).toMatchObject({ total: 1 })
  })

  it('suspends and reinstates a user', async () => {
    const { user } = await createPatient()

    const off = await post(`/api/admin/users/${user.id}/suspend`, { suspend: true })
    const again = await post(`/api/admin/users/${user.id}/suspend`, { suspend: true })
    const on = await post(`/api/admin/users/${user.id}/suspend`, { suspend: false })

    expect(off.status).toBe(200)
    expect(again.status).toBe(409)
    expect(on.status).toBe(200)
    expect((await prisma.user.findUniqueOrThrow({ where: { id: user.id } })).status).toBe('active')
  })

  it('never suspends an admin', async () => {
    const other = await createAdmin()
    expect((await post(`/api/admin/users/${other.user.id}/suspend`, { suspend: true })).status).toBe(403)
  })

  it('shows the system audit log, filterable by action', async () => {
    const { user } = await createDoctor({ status: 'pending' })
    await post(`/api/admin/doctors/${(await prisma.doctor.findUniqueOrThrow({ where: { userId: user.id } })).id}/approve`)

    const res = await get('/api/admin/audit?action=update')

    expect(res.status).toBe(200)
    expect(res.body.data.length).toBeGreaterThan(0)
  })
})
