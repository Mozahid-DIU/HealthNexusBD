import request from 'supertest'
import { beforeEach, describe, expect, it } from 'vitest'
import { createApp } from '../../src/app.ts'
import { prisma } from '../../src/config/prisma.ts'
import { decrypt } from '../../src/utils/crypto.ts'
import { resetDb } from '../helpers/db.ts'
import { createDoctor, createPatient, grantSession } from '../helpers/factories.ts'

const app = createApp()

type Doctor = Awaited<ReturnType<typeof createDoctor>>
type Patient = Awaited<ReturnType<typeof createPatient>>

let doctor: Doctor
let patient: Patient

beforeEach(async () => {
  await resetDb()
  doctor = await createDoctor()
  patient = await createPatient()
  await prisma.patient.update({
    where: { id: patient.patient.id },
    data: { allergies: ['Penicillin'], chronicDiseases: ['Type 2 Diabetes'] },
  })
})

const post = (path: string, body: object, auth = doctor.auth) =>
  request(app).post(path).set('Authorization', auth).send(body)

async function createRecord() {
  const res = await post('/api/doctor/records', {
    patientId: patient.patient.id,
    diagnosis: 'Pneumonia',
    content: 'Confidential clinical note',
    symptoms: ['fever'],
  })
  expect(res.status).toBe(201)
  return res.body.data.id as string
}

describe('patient search', () => {
  it('finds a patient by UHID and masks the phone number', async () => {
    const res = await request(app)
      .get(`/api/doctor/search?uhid=${patient.patient.uhid}`)
      .set('Authorization', doctor.auth)

    expect(res.status).toBe(200)
    expect(res.body.data.uhid).toBe(patient.patient.uhid)
    expect(res.body.data.phone).toMatch(/^\*+\d{3}$/)
  })

  it('finds a patient by phone', async () => {
    const res = await request(app)
      .get(`/api/doctor/search?phone=${patient.user.phone}`)
      .set('Authorization', doctor.auth)

    expect(res.status).toBe(200)
    expect(res.body.data.uhid).toBe(patient.patient.uhid)
  })

  it('returns 404 for an unknown UHID and 400 with no search term', async () => {
    const missing = await request(app).get('/api/doctor/search?uhid=BD-2000-00000').set('Authorization', doctor.auth)
    const empty = await request(app).get('/api/doctor/search').set('Authorization', doctor.auth)

    expect(missing.status).toBe(404)
    expect(empty.status).toBe(400)
  })
})

describe('medical records (need an active consent session)', () => {
  it('refuses to create a record without consent', async () => {
    const res = await post('/api/doctor/records', {
      patientId: patient.patient.id,
      diagnosis: 'Pneumonia',
      content: 'note',
    })
    expect(res.status).toBe(403)
  })

  it('encrypts the clinical note at rest', async () => {
    await grantSession(doctor.doctor.id, patient.patient.id)
    const id = await createRecord()

    const row = await prisma.medicalRecord.findUniqueOrThrow({ where: { id } })
    expect(row.contentEncrypted).not.toContain('Confidential')
    expect(decrypt(row.contentEncrypted)).toBe('Confidential clinical note')
  })

  it('lists the session patient and returns their records decrypted', async () => {
    await grantSession(doctor.doctor.id, patient.patient.id)
    await createRecord()

    const mine = await request(app).get('/api/doctor/patients').set('Authorization', doctor.auth)
    const records = await request(app)
      .get(`/api/doctor/patients/${patient.patient.id}/records`)
      .set('Authorization', doctor.auth)

    expect(mine.body.data).toHaveLength(1)
    expect(records.status).toBe(200)
    expect(JSON.stringify(records.body)).toContain('Confidential clinical note')
  })

  it('only lets the author add a prescription to a record', async () => {
    await grantSession(doctor.doctor.id, patient.patient.id)
    const id = await createRecord()
    const other = await createDoctor()
    await grantSession(other.doctor.id, patient.patient.id)
    const body = {
      medications: [{ name: 'Paracetamol', dose: '500mg', frequency: 'TDS' }],
      recommendedTests: ['CBC'],
    }

    const own = await post(`/api/doctor/records/${id}/prescription`, body)
    const foreign = await post(`/api/doctor/records/${id}/prescription`, body, other.auth)

    expect(own.status).toBe(201)
    expect(foreign.status).toBe(403)
  })

  it('generates an AI summary with allergy alerts from the patient profile', async () => {
    await grantSession(doctor.doctor.id, patient.patient.id)
    const id = await createRecord()
    await post(`/api/doctor/records/${id}/prescription`, {
      medications: [{ name: 'Amoxicillin', dose: '500mg', frequency: 'TDS' }],
    })

    const res = await post(`/api/doctor/records/${id}/ai-summary`, {})

    expect(res.status).toBe(201)
    expect(res.body.data.model).toBe('demo-rule-based')
    expect(res.body.data.allergyAlerts.join(' ')).toMatch(/Amoxicillin.*Penicillin/)
  })

  it('blocks a pending doctor from all clinical actions', async () => {
    const pending = await createDoctor({ status: 'pending' })
    const res = await request(app).get('/api/doctor/patients').set('Authorization', pending.auth)
    expect(res.status).toBe(403)
  })
})
