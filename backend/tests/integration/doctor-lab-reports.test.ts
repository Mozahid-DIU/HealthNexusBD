import request from 'supertest'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp } from '../../src/app.ts'
import { prisma } from '../../src/config/prisma.ts'
import { resetDb } from '../helpers/db.ts'
import { createDoctor, createLab, createPatient, createPrescription, grantSession } from '../helpers/factories.ts'

vi.mock('../../src/services/storage.ts', () => import('../helpers/fake-storage.ts'))

const app = createApp()
const PDF = Buffer.from('%PDF-1.4\n% lipid profile\n%%EOF\n')

type Doctor = Awaited<ReturnType<typeof createDoctor>>
type Patient = Awaited<ReturnType<typeof createPatient>>

let doctor: Doctor
let patient: Patient
let reportId: string

async function uploadFor(p: Patient, testName: string) {
  const lab = await createLab()
  await createPrescription(p.patient.id, doctor.doctor.id, [testName])
  const res = await request(app)
    .post('/api/lab/reports')
    .set('Authorization', lab.auth)
    .field('uhid', p.patient.uhid)
    .field('testName', testName)
    .attach('file', PDF, { filename: 'r.pdf', contentType: 'application/pdf' })
  expect(res.status).toBe(201)
  return res.body.data.id as string
}

beforeEach(async () => {
  await resetDb()
  doctor = await createDoctor()
  patient = await createPatient()
  reportId = await uploadFor(patient, 'Lipid Profile')
})

const list = (patientId = patient.patient.id, auth = doctor.auth) =>
  request(app).get(`/api/doctor/patients/${patientId}/lab-reports`).set('Authorization', auth)

const file = (id = reportId, patientId = patient.patient.id, auth = doctor.auth) =>
  request(app).get(`/api/doctor/patients/${patientId}/lab-reports/${id}/file`).set('Authorization', auth).buffer(true)

describe('doctor access to a patient’s lab reports', () => {
  it('is refused without an active consent session', async () => {
    expect((await list()).status).toBe(403)
    expect((await file()).status).toBe(403)
  })

  it('lists the reports with API links once consent is granted', async () => {
    await grantSession(doctor.doctor.id, patient.patient.id)

    const res = await list()

    expect(res.status).toBe(200)
    expect(res.body.data).toHaveLength(1)
    expect(res.body.data[0]).toMatchObject({
      id: reportId,
      testName: 'Lipid Profile',
      fileUrl: `/api/doctor/patients/${patient.patient.id}/lab-reports/${reportId}/file`,
    })
    expect(JSON.stringify(res.body)).not.toContain('cloudinary')
  })

  it('downloads the decrypted PDF and audits the view', async () => {
    await grantSession(doctor.doctor.id, patient.patient.id)

    const res = await file()

    expect(res.status).toBe(200)
    expect(res.headers['content-type']).toBe('application/pdf')
    expect(Buffer.compare(res.body as Buffer, PDF)).toBe(0)
    const entry = await prisma.auditLog.findFirst({
      where: { actorUserId: doctor.user.id, action: 'view', resource: `lab_report_file:${reportId}` },
    })
    expect(entry?.patientId).toBe(patient.patient.id)
  })

  it('audits listing the reports', async () => {
    await grantSession(doctor.doctor.id, patient.patient.id)
    await list()

    const entry = await prisma.auditLog.findFirst({
      where: { actorUserId: doctor.user.id, action: 'view', resource: { startsWith: 'lab_reports' } },
    })
    expect(entry).not.toBeNull()
  })

  it('cannot fetch another patient’s report through a consented patient’s URL', async () => {
    const other = await createPatient()
    const otherReport = await uploadFor(other, 'CBC')
    await grantSession(doctor.doctor.id, patient.patient.id)

    expect((await file(otherReport)).status).toBe(404)
  })

  it('loses access as soon as the session is revoked or expires', async () => {
    const session = await grantSession(doctor.doctor.id, patient.patient.id)
    expect((await file()).status).toBe(200)

    await prisma.accessSession.update({ where: { id: session.id }, data: { status: 'revoked' } })

    expect((await list()).status).toBe(403)
    expect((await file()).status).toBe(403)
  })

  it('is refused for another doctor without their own consent', async () => {
    await grantSession(doctor.doctor.id, patient.patient.id)
    const other = await createDoctor()

    expect((await list(patient.patient.id, other.auth)).status).toBe(403)
  })
})

describe('lab patient search by mobile number (FR-8)', () => {
  it('finds the patient by phone', async () => {
    const lab = await createLab()

    const res = await request(app).get(`/api/lab/search?phone=${patient.user.phone}`).set('Authorization', lab.auth)

    expect(res.status).toBe(200)
    expect(res.body.data.uhid).toBe(patient.patient.uhid)
    expect(res.body.data.prescribedTests).toEqual([{ name: 'Lipid Profile', status: 'uploaded' }])
  })

  it('returns 404 for an unknown phone and 400 for a malformed one or none', async () => {
    const lab = await createLab()
    const search = (q: string) => request(app).get(`/api/lab/search${q}`).set('Authorization', lab.auth)

    expect((await search('?phone=01999999999')).status).toBe(404)
    expect((await search('?phone=12345')).status).toBe(400)
    expect((await search('')).status).toBe(400)
  })
})
