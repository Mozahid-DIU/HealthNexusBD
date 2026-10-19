import request from 'supertest'
import { beforeEach, describe, expect, it } from 'vitest'
import { createApp } from '../../src/app.ts'
import { prisma } from '../../src/config/prisma.ts'
import { encrypt } from '../../src/utils/crypto.ts'
import { writeAudit } from '../../src/utils/audit.ts'
import { resetDb } from '../helpers/db.ts'
import { createDoctor, createPatient } from '../helpers/factories.ts'

const app = createApp()
let patient: Awaited<ReturnType<typeof createPatient>>

beforeEach(async () => {
  await resetDb()
  patient = await createPatient()
})

const get = (path: string, auth = patient.auth) => request(app).get(path).set('Authorization', auth)

async function addRecord(note: string) {
  const { doctor } = await createDoctor()
  return prisma.medicalRecord.create({
    data: {
      patientId: patient.patient.id,
      doctorId: doctor.id,
      diagnosis: 'Hypertension',
      contentEncrypted: encrypt(note),
    },
  })
}

describe('profile', () => {
  it('returns the UHID and contact details', async () => {
    const res = await get('/api/patient/profile')

    expect(res.status).toBe(200)
    expect(res.body.data.uhid).toBe(patient.patient.uhid)
  })

  it('updates health info', async () => {
    const res = await request(app)
      .patch('/api/patient/profile')
      .set('Authorization', patient.auth)
      .send({ bloodGroup: 'O+', allergies: ['Penicillin'], chronicDiseases: ['Asthma'] })

    expect(res.status).toBe(200)
    const row = await prisma.patient.findUniqueOrThrow({ where: { id: patient.patient.id } })
    expect(row).toMatchObject({ bloodGroup: 'O+', allergies: ['Penicillin'], chronicDiseases: ['Asthma'] })
  })

  it('rejects an empty or invalid update', async () => {
    const empty = await request(app).patch('/api/patient/profile').set('Authorization', patient.auth).send({})
    const bad = await request(app)
      .patch('/api/patient/profile')
      .set('Authorization', patient.auth)
      .send({ bloodGroup: 'Z+' })

    expect(empty.status).toBe(400)
    expect(bad.status).toBe(400)
  })
})

describe('own medical records', () => {
  it('lists and opens records, decrypted', async () => {
    const record = await addRecord('Take medicine after meals')

    const list = await get('/api/patient/records')
    const one = await get(`/api/patient/records/${record.id}`)

    expect(list.body.meta.total).toBe(1)
    expect(one.status).toBe(200)
    expect(one.body.data.content).toBe('Take medicine after meals')
  })

  it("cannot open another patient's record", async () => {
    const record = await addRecord('private')
    const other = await createPatient()

    expect((await get(`/api/patient/records/${record.id}`, other.auth)).status).toBe(404)
  })
})

describe('"who saw my data" audit', () => {
  it('shows who accessed the patient, with names', async () => {
    const { user } = await createDoctor()
    await writeAudit({ actorUserId: user.id, action: 'view', patientId: patient.patient.id })

    const res = await get('/api/patient/audit')

    expect(res.status).toBe(200)
    expect(res.body.data).toHaveLength(1)
    expect(JSON.stringify(res.body.data[0])).toContain('Dr. Test')
  })

  it("does not include other patients' entries", async () => {
    const other = await createPatient()
    const { user } = await createDoctor()
    await writeAudit({ actorUserId: user.id, action: 'view', patientId: other.patient.id })

    expect((await get('/api/patient/audit')).body.data).toHaveLength(0)
  })
})
