import request from 'supertest'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { env } from '../../src/config/env.ts'
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

describe('patient clinical profile (needs an active consent session)', () => {
  const profile = () =>
    request(app).get(`/api/doctor/patients/${patient.patient.id}`).set('Authorization', doctor.auth)

  it('is refused without consent', async () => {
    expect((await profile()).status).toBe(403)
  })

  it('returns what a doctor needs before prescribing, and audits the view', async () => {
    await prisma.patient.update({
      where: { id: patient.patient.id },
      data: { bloodGroup: 'B+', gender: 'male', dateOfBirth: new Date('1990-05-01') },
    })
    const session = await grantSession(doctor.doctor.id, patient.patient.id)

    const res = await profile()

    expect(res.status).toBe(200)
    expect(res.body.data).toMatchObject({
      id: patient.patient.id,
      uhid: patient.patient.uhid,
      fullName: patient.patient.fullName,
      gender: 'male',
      bloodGroup: 'B+',
      allergies: ['Penicillin'],
      chronicDiseases: ['Type 2 Diabetes'],
      consentExpiresAt: session.expiresAt.toISOString(),
    })
    expect(res.body.data.dateOfBirth).toMatch(/^1990-05-01/)
    // Contact and identity numbers are not part of the clinical view.
    expect(res.body.data).not.toHaveProperty('nid')
    expect(res.body.data).not.toHaveProperty('phone')
    const entry = await prisma.auditLog.findFirst({
      where: { actorUserId: doctor.user.id, action: 'view', resource: `patient_profile:${patient.patient.id}` },
    })
    expect(entry).not.toBeNull()
  })

  it('audits the profile once per consent session, not on every poll', async () => {
    await grantSession(doctor.doctor.id, patient.patient.id)
    const where = { actorUserId: doctor.user.id, action: 'view' as const, resource: `patient_profile:${patient.patient.id}` }

    await profile()
    await profile()
    await profile()
    expect(await prisma.auditLog.count({ where })).toBe(1)

    // A fresh grant is a new access episode, so it is audited again.
    await prisma.accessSession.updateMany({ where: { doctorId: doctor.doctor.id }, data: { status: 'revoked' } })
    await grantSession(doctor.doctor.id, patient.patient.id)
    await profile()
    expect(await prisma.auditLog.count({ where })).toBe(2)
  })

  it('404s an unknown patient and 400s a bad id', async () => {
    const missing = await request(app)
      .get('/api/doctor/patients/00000000-0000-0000-0000-000000000000')
      .set('Authorization', doctor.auth)
    const bad = await request(app).get('/api/doctor/patients/nope').set('Authorization', doctor.auth)

    expect([403, 404]).toContain(missing.status)
    expect(bad.status).toBe(400)
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

  it('accepts a prescription with only recommended tests (no medicine yet)', async () => {
    await grantSession(doctor.doctor.id, patient.patient.id)
    const id = await createRecord()

    const res = await post(`/api/doctor/records/${id}/prescription`, { medications: [], recommendedTests: ['CBC', 'HbA1c'] })

    expect(res.status).toBe(201)
  })

  it('rejects a prescription with neither medicines nor tests', async () => {
    await grantSession(doctor.doctor.id, patient.patient.id)
    const id = await createRecord()

    const res = await post(`/api/doctor/records/${id}/prescription`, { medications: [], recommendedTests: [] })

    expect(res.status).toBe(400)
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

  it('explains the prescribed medicines’ side effects and keeps them with the summary', async () => {
    await grantSession(doctor.doctor.id, patient.patient.id)
    const id = await createRecord()
    await post(`/api/doctor/records/${id}/prescription`, {
      medications: [{ name: 'Metformin', dose: '500mg', frequency: 'BD' }],
    })

    const res = await post(`/api/doctor/records/${id}/ai-summary`, {})

    expect(res.body.data.sideEffects).toHaveLength(1)
    expect(res.body.data.sideEffects[0]).toMatchObject({ drug: 'Metformin' })
    const stored = await prisma.aiSummary.findUniqueOrThrow({ where: { id: res.body.data.id } })
    expect(stored.sideEffects).toEqual(res.body.data.sideEffects)
  })

  it('never sends the patient’s name or phone in the note to Gemini', async () => {
    await grantSession(doctor.doctor.id, patient.patient.id)
    const res = await post('/api/doctor/records', {
      patientId: patient.patient.id,
      diagnosis: 'Pneumonia',
      content: `${patient.patient.fullName} says fever for 3 days; call ${patient.user.phone}.`,
    })
    const fetchMock = vi.fn().mockResolvedValue(new Response('quota', { status: 429 }))
    vi.stubGlobal('fetch', fetchMock)
    env.GEMINI_API_KEY = 'test-key'
    try {
      await post(`/api/doctor/records/${res.body.data.id}/ai-summary`, {})
    } finally {
      env.GEMINI_API_KEY = ''
      vi.unstubAllGlobals()
    }

    const sent = String(fetchMock.mock.calls[0][1].body)
    expect(sent).toContain('fever for 3 days')
    expect(sent).not.toContain(patient.patient.fullName.split(' ')[0])
    expect(sent).not.toContain(patient.user.phone)
  })

  describe('AI overview of the whole history', () => {
    const overview = (auth = doctor.auth) =>
      request(app).get(`/api/doctor/patients/${patient.patient.id}/ai-overview`).set('Authorization', auth)

    it('needs the patient’s consent', async () => {
      const res = await overview()
      expect(res.status).toBe(403)
      expect(res.body.code).toBe('CONSENT_REQUIRED')
    })

    it('summarises every visit with allergy warnings, and records the view', async () => {
      await grantSession(doctor.doctor.id, patient.patient.id)
      const id = await createRecord()
      await post(`/api/doctor/records/${id}/prescription`, {
        medications: [{ name: 'Amoxicillin', dose: '500mg', frequency: 'TDS' }],
      })

      const res = await overview()

      expect(res.status).toBe(200)
      expect(res.body.data).toMatchObject({ model: 'demo-rule-based', visitCount: 1 })
      expect(res.body.data.summary).toContain('Pneumonia')
      expect(res.body.data.alerts.join(' ')).toMatch(/Amoxicillin.*Penicillin/)
      const audit = await prisma.auditLog.findFirst({
        where: { actorUserId: doctor.user.id, patientId: patient.patient.id, resource: 'ai_overview' },
      })
      expect(audit?.action).toBe('view')
    })

    it('never puts the clinical note or the patient’s identity into the overview input', async () => {
      await grantSession(doctor.doctor.id, patient.patient.id)
      await createRecord()

      const res = await overview()

      expect(JSON.stringify(res.body.data)).not.toContain('Confidential clinical note')
      expect(JSON.stringify(res.body.data)).not.toContain(patient.patient.uhid)
    })

    it('reflects a new visit straight away', async () => {
      await grantSession(doctor.doctor.id, patient.patient.id)
      await createRecord()
      const first = await overview()

      await post('/api/doctor/records', { patientId: patient.patient.id, diagnosis: 'Migraine', content: 'Headache' })
      const second = await overview()

      expect(first.body.data.visitCount).toBe(1)
      expect(second.body.data.visitCount).toBe(2)
      expect(second.body.data.summary).toContain('Migraine')
    })
  })

  it('blocks a pending doctor from all clinical actions', async () => {
    const pending = await createDoctor({ status: 'pending' })
    const res = await request(app).get('/api/doctor/patients').set('Authorization', pending.auth)
    expect(res.status).toBe(403)
  })
})
