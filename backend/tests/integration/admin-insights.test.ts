import request from 'supertest'
import { beforeEach, describe, expect, it } from 'vitest'
import { createApp } from '../../src/app.ts'
import { prisma } from '../../src/config/prisma.ts'
import { resetDb } from '../helpers/db.ts'
import { createAdmin, createDoctor, createLab, createPatient, createPrescription, grantSession } from '../helpers/factories.ts'

const app = createApp()
let admin: Awaited<ReturnType<typeof createAdmin>>

beforeEach(async () => {
  await resetDb()
  admin = await createAdmin()
})

const get = (path: string) => request(app).get(path).set('Authorization', admin.auth)
const DAY = 86_400_000
/** The calendar day in Dhaka, which is how the admin reads "today". */
const dhakaDay = (d: Date) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Dhaka' }).format(d)

type Point = { date: string; patients: number; doctors: number; labs: number; records: number; labReports: number; consents: number }

describe('activity trends', () => {
  it('returns one point per Dhaka day, oldest first, ending today', async () => {
    const res = await get('/api/admin/trends?days=7')

    expect(res.status).toBe(200)
    const series: Point[] = res.body.data.series
    expect(series).toHaveLength(7)
    expect(series.at(-1)!.date).toBe(dhakaDay(new Date()))
    expect(series[0].date).toBe(dhakaDay(new Date(Date.now() - 6 * DAY)))
    expect(series[0]).toEqual({ date: series[0].date, patients: 0, doctors: 0, labs: 0, records: 0, labReports: 0, consents: 0 })
  })

  it('counts new accounts by role, records, lab reports and consents on the right day', async () => {
    const patient = await createPatient()
    const { doctor } = await createDoctor()
    await createLab()
    await createPrescription(patient.patient.id, doctor.id, ['CBC'])
    await grantSession(doctor.id, patient.patient.id)
    // A patient who joined at 02:00 Dhaka time two days ago (still the day before in UTC).
    const late = await createPatient()
    const utcMidnight = new Date(new Date().toISOString().slice(0, 10) + 'T00:00:00Z').getTime()
    const at = new Date(utcMidnight - 2 * DAY + 20 * 3_600_000)
    await prisma.user.update({ where: { id: late.user.id }, data: { createdAt: at } })

    const res = await get('/api/admin/trends?days=7')
    const series: Point[] = res.body.data.series
    const today = series.find((p) => p.date === dhakaDay(new Date()))!
    const thatDay = series.find((p) => p.date === dhakaDay(at))!

    expect(today).toMatchObject({ patients: 1, doctors: 1, labs: 1, records: 1, consents: 1 })
    expect(thatDay.patients).toBe(1)
    expect(dhakaDay(at)).not.toBe(at.toISOString().slice(0, 10))
    // The admin account itself is not a "registration" on the platform chart.
    expect(series.reduce((n, p) => n + p.patients + p.doctors + p.labs, 0)).toBe(4)
  })

  it('totals this period against the one before it', async () => {
    await createPatient()
    const old = await createPatient()
    await prisma.user.update({ where: { id: old.user.id }, data: { createdAt: new Date(Date.now() - 10 * DAY) } })
    const older = await createPatient()
    await prisma.user.update({ where: { id: older.user.id }, data: { createdAt: new Date(Date.now() - 40 * DAY) } })

    const res = await get('/api/admin/trends?days=7')

    expect(res.body.data.totals.current.patients).toBe(1)
    expect(res.body.data.totals.previous.patients).toBe(1) // 10 days ago; 40 is outside both
    expect(res.body.data.days).toBe(7)
  })

  it('defaults to 30 days and only accepts 7, 30 or 90', async () => {
    expect((await get('/api/admin/trends')).body.data.series).toHaveLength(30)
    expect((await get('/api/admin/trends?days=90')).body.data.series).toHaveLength(90)
    expect((await get('/api/admin/trends?days=5')).status).toBe(400)
  })

  it('is for admins only', async () => {
    const patient = await createPatient()
    expect((await request(app).get('/api/admin/trends').set('Authorization', patient.auth)).status).toBe(403)
  })
})

describe('finding people', () => {
  it('searches users by name, email, phone, UHID, BMDC or licence, ignoring case', async () => {
    const patient = await createPatient()
    const { user: doctorUser, doctor } = await createDoctor()
    const { lab } = await createLab()

    const ids = async (q: string) =>
      ((await get(`/api/admin/users?q=${encodeURIComponent(q)}`)).body.data as Array<{ id: string }>).map((u) => u.id)

    expect(await ids(patient.patient.uhid.toLowerCase())).toEqual([patient.user.id])
    expect(await ids(doctor.bmdcNumber)).toEqual([doctorUser.id])
    expect(await ids(doctor.fullName.toUpperCase())).toEqual([doctorUser.id])
    expect(await ids(lab.licenseNumber)).toHaveLength(1)
    expect(await ids(doctorUser.email.slice(0, 7))).toContain(doctorUser.id)
    expect(await ids('nobody-like-this')).toEqual([])
  })

  it('searches the audit log by who acted or which patient', async () => {
    const patient = await createPatient()
    const { doctor, user: doctorUser } = await createDoctor()
    await grantSession(doctor.id, patient.patient.id)
    await prisma.auditLog.create({ data: { actorUserId: doctorUser.id, action: 'view', patientId: patient.patient.id, resource: 'patient_profile:x' } })
    await prisma.auditLog.create({ data: { actorUserId: admin.user.id, action: 'update', resource: 'user_suspended:y' } })

    const byPatient = await get(`/api/admin/audit?q=${patient.patient.uhid}`)
    const byActor = await get(`/api/admin/audit?q=${doctorUser.email}`)

    expect(byPatient.body.data).toHaveLength(1)
    expect(byActor.body.data).toHaveLength(1)
    expect(byActor.body.data[0].actor.email).toBe(doctorUser.email)
  })
})

describe('activity feed', () => {
  it('can leave out sign-ins, so the feed shows what people actually did', async () => {
    const { user } = await createDoctor()
    await prisma.auditLog.create({ data: { actorUserId: user.id, action: 'login' } })
    await prisma.auditLog.create({ data: { actorUserId: admin.user.id, action: 'update', resource: 'doctor_approved:x' } })

    const all = await get('/api/admin/audit')
    const meaningful = await get('/api/admin/audit?exclude=login')

    expect(all.body.data).toHaveLength(2)
    expect(meaningful.body.data.map((r: { action: string }) => r.action)).toEqual(['update'])
    expect((await get('/api/admin/audit?exclude=nonsense')).status).toBe(400)
  })
})

describe('account safety', () => {
  const post = (path: string, body: object = {}) => request(app).post(path).set('Authorization', admin.auth).send(body)

  it('will not reactivate a rejected doctor or lab without verification', async () => {
    const { user: doctorUser, doctor } = await createDoctor({ status: 'pending' })
    const { user: labUser } = await createLab({ status: 'pending' })
    await post(`/api/admin/doctors/${doctor.id}/reject`, { reason: 'Not in the BMDC registry' })
    await prisma.user.update({ where: { id: labUser.id }, data: { status: 'suspended' } })

    const doctorRes = await post(`/api/admin/users/${doctorUser.id}/suspend`, { suspend: false })
    const labRes = await post(`/api/admin/users/${labUser.id}/suspend`, { suspend: false })

    expect(doctorRes.status).toBe(409)
    expect(doctorRes.body.code).toBe('NEEDS_VERIFICATION')
    expect(labRes.body.code).toBe('NEEDS_VERIFICATION')
    expect((await prisma.user.findUniqueOrThrow({ where: { id: doctorUser.id } })).status).toBe('suspended')
  })

  it('still reactivates a verified doctor who was suspended later', async () => {
    const { user, doctor } = await createDoctor({ status: 'pending' })
    await post(`/api/admin/doctors/${doctor.id}/approve`)
    await post(`/api/admin/users/${user.id}/suspend`, { suspend: true })

    const res = await post(`/api/admin/users/${user.id}/suspend`, { suspend: false })

    expect(res.status).toBe(200)
  })

  it('will not "reject" an account that is already approved (that is a suspension)', async () => {
    const { doctor } = await createDoctor({ status: 'pending' })
    await post(`/api/admin/doctors/${doctor.id}/approve`)
    const { lab } = await createLab({ status: 'pending' })
    await post(`/api/admin/labs/${lab.id}/approve`)

    expect((await post(`/api/admin/doctors/${doctor.id}/reject`, { reason: 'Changed my mind' })).status).toBe(409)
    expect((await post(`/api/admin/labs/${lab.id}/reject`, { reason: 'Changed my mind' })).status).toBe(409)
  })

  it('tells the users list who still needs verification', async () => {
    await createDoctor({ status: 'pending' })
    await createLab()

    const res = await get('/api/admin/users')
    const doctorRow = res.body.data.find((u: { role: string }) => u.role === 'doctor')
    const labRow = res.body.data.find((u: { role: string }) => u.role === 'lab')

    expect(doctorRow.doctor.isBmdcVerified).toBe(false)
    expect(labRow.lab.isApproved).toBe(true)
  })

  it('treats % and _ in a search as plain text', async () => {
    await createPatient()
    expect((await get('/api/admin/users?q=%25')).body.data).toEqual([])
    expect((await get('/api/admin/users?q=_')).body.data).toEqual([])
  })
})

describe('verification against the registries', () => {
  it('shows the BMDC registry entry next to what the doctor submitted', async () => {
    const { doctor } = await createDoctor({ status: 'pending' })
    await prisma.doctorRegistry.create({ data: { bmdcNumber: doctor.bmdcNumber, fullName: 'Dr. Someone Else', specialization: 'Cardiologist' } })
    await createDoctor({ status: 'pending' }) // not in the registry

    const res = await get('/api/admin/doctors?status=pending')
    const rows = res.body.data as Array<{ id: string; registry: unknown }>

    expect(rows.find((r) => r.id === doctor.id)!.registry).toEqual({ fullName: 'Dr. Someone Else', specialization: 'Cardiologist' })
    expect(rows.find((r) => r.id !== doctor.id)!.registry).toBeNull()
  })

  it('shows the DGHS registry entry next to what the lab submitted', async () => {
    const { lab } = await createLab({ status: 'pending' })
    await prisma.labRegistry.create({ data: { licenseNumber: lab.licenseNumber, centerName: lab.centerName, address: 'Dhanmondi' } })

    const res = await get('/api/admin/labs?status=pending')

    expect(res.body.data[0].registry).toEqual({ centerName: lab.centerName, address: 'Dhanmondi' })
  })
})
