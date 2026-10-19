import request from 'supertest'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp } from '../../src/app.ts'
import { prisma } from '../../src/config/prisma.ts'
import { decrypt, encrypt } from '../../src/utils/crypto.ts'
import { SAMPLE_REPORT_PDF_URL } from '../../src/services/reportFiles.ts'
import { resetDb } from '../helpers/db.ts'
import { SAMPLE_PDF_BYTES, downloadCalls, stored } from '../helpers/fake-storage.ts'
import { createDoctor, createLab, createPatient, createPrescription } from '../helpers/factories.ts'

vi.mock('../../src/services/storage.ts', () => import('../helpers/fake-storage.ts'))

const app = createApp()
const PDF = Buffer.from('%PDF-1.4\n% HealthNexus test report\n1 0 obj<<>>endobj\n%%EOF\n')
const TEST_NAME = 'HbA1c'

type Lab = Awaited<ReturnType<typeof createLab>>
type Patient = Awaited<ReturnType<typeof createPatient>>

let lab: Lab
let patient: Patient

beforeEach(async () => {
  await resetDb()
  stored.clear()
  downloadCalls.length = 0
  lab = await createLab()
  patient = await createPatient()
  const { doctor } = await createDoctor()
  await createPrescription(patient.patient.id, doctor.id, [TEST_NAME])
})

function upload(file: Buffer = PDF, testName = TEST_NAME, auth = lab.auth) {
  return request(app)
    .post('/api/lab/reports')
    .set('Authorization', auth)
    .field('uhid', patient.patient.uhid)
    .field('testName', testName)
    .attach('file', file, { filename: 'report.pdf', contentType: 'application/pdf' })
}

async function uploadOk(): Promise<string> {
  const res = await upload()
  expect(res.status).toBe(201)
  return res.body.data.id as string
}

describe('lab patient search', () => {
  it('shows only prescribed tests and their upload status, not clinical history', async () => {
    const before = await request(app)
      .get(`/api/lab/search?uhid=${patient.patient.uhid}`)
      .set('Authorization', lab.auth)
    await uploadOk()
    const after = await request(app)
      .get(`/api/lab/search?uhid=${patient.patient.uhid}`)
      .set('Authorization', lab.auth)

    expect(before.status).toBe(200)
    expect(before.body.data.prescribedTests).toEqual([{ name: TEST_NAME, status: 'pending' }])
    expect(after.body.data.prescribedTests).toEqual([{ name: TEST_NAME, status: 'uploaded' }])
    expect(before.body.data).not.toHaveProperty('records')
  })

  it('lists the lab uploads with API links', async () => {
    const id = await uploadOk()

    const res = await request(app).get('/api/lab/uploads').set('Authorization', lab.auth)

    expect(res.body.data[0]).toMatchObject({ id, fileUrl: `/api/lab/reports/${id}/file` })
  })
})

describe('lab report upload', () => {
  it('stores only ciphertext in file storage', async () => {
    await uploadOk()

    const [object] = [...stored.values()]
    expect(object.includes(Buffer.from('%PDF'))).toBe(false)
    expect(object.includes(Buffer.from('HealthNexus test report'))).toBe(false)
  })

  it('keeps the storage URL encrypted in the database', async () => {
    const id = await uploadOk()

    const row = await prisma.labReport.findUniqueOrThrow({ where: { id } })
    expect(row.fileRefEncrypted).not.toContain('cloudinary')
    expect(decrypt(row.fileRefEncrypted)).toMatch(/^aes-gcm:v1:https:\/\/res\.cloudinary\.com\//)
  })

  it('rejects a file whose bytes are not a PDF', async () => {
    const res = await upload(Buffer.from('MZ\x90\x00 not a pdf'))
    expect(res.status).toBe(400)
  })

  it('only allows reports for a prescribed test', async () => {
    const res = await upload(PDF, 'MRI Brain')
    expect(res.status).toBe(403)
  })

  it('does not let a pending (unapproved) lab upload', async () => {
    const pending = await createLab({ status: 'pending' })
    const res = await upload(PDF, TEST_NAME, pending.auth)
    expect(res.status).toBe(403)
  })
})

describe('patient access to report files', () => {
  it('lists reports with an API link, never a storage URL', async () => {
    const id = await uploadOk()

    const res = await request(app).get('/api/patient/lab-reports').set('Authorization', patient.auth)

    expect(res.status).toBe(200)
    expect(res.body.data[0]).toMatchObject({ id, fileUrl: `/api/patient/lab-reports/${id}/file` })
    expect(JSON.stringify(res.body)).not.toContain('cloudinary')
  })

  it('downloads the decrypted PDF with safe headers', async () => {
    const id = await uploadOk()

    const res = await request(app)
      .get(`/api/patient/lab-reports/${id}/file`)
      .set('Authorization', patient.auth)
      .buffer(true)

    expect(res.status).toBe(200)
    expect(res.headers['content-type']).toBe('application/pdf')
    expect(res.headers['cache-control']).toBe('no-store')
    expect(res.headers['x-content-type-options']).toBe('nosniff')
    expect(Buffer.compare(res.body as Buffer, PDF)).toBe(0)
  })

  it("returns 404 for another patient's report", async () => {
    const id = await uploadOk()
    const other = await createPatient()

    const res = await request(app).get(`/api/patient/lab-reports/${id}/file`).set('Authorization', other.auth)

    expect(res.status).toBe(404)
  })

  it('requires a token and the patient role', async () => {
    const id = await uploadOk()

    expect((await request(app).get(`/api/patient/lab-reports/${id}/file`)).status).toBe(401)
    expect(
      (await request(app).get(`/api/patient/lab-reports/${id}/file`).set('Authorization', lab.auth)).status,
    ).toBe(403)
  })

  describe('stored file refs are validated before any fetch', () => {
    async function reportWithRef(ref: string) {
      const { doctor } = await createDoctor()
      const record = await createPrescription(patient.patient.id, doctor.id, ['CBC'])
      return prisma.labReport.create({
        data: {
          patientId: patient.patient.id,
          labId: lab.lab.id,
          recordId: record.id,
          testName: 'CBC',
          fileRefEncrypted: encrypt(ref),
        },
      })
    }
    const download = (id: string) =>
      request(app).get(`/api/patient/lab-reports/${id}/file`).set('Authorization', patient.auth).buffer(true)

    it('serves the seed sample PDF', async () => {
      const report = await reportWithRef(SAMPLE_REPORT_PDF_URL)

      const res = await download(report.id)

      expect(res.status).toBe(200)
      expect(Buffer.compare(res.body as Buffer, SAMPLE_PDF_BYTES)).toBe(0)
    })

    it('refuses any other unencrypted ref without fetching it', async () => {
      const report = await reportWithRef('https://evil.example/leak.pdf')

      const res = await download(report.id)

      expect(res.status).toBe(500)
      expect(downloadCalls).toEqual([])
    })

    it('refuses an encrypted ref that points outside file storage', async () => {
      const report = await reportWithRef('aes-gcm:v1:https://evil.example/x')

      const res = await download(report.id)

      expect(res.status).toBe(500)
      expect(downloadCalls).toEqual([])
    })
  })

  it('fails closed when the stored ciphertext has been tampered with', async () => {
    const id = await uploadOk()
    const [url, object] = [...stored.entries()][0]
    const tampered = Buffer.from(object)
    tampered[tampered.length - 1] ^= 0xff
    stored.set(url, tampered)

    const res = await request(app).get(`/api/patient/lab-reports/${id}/file`).set('Authorization', patient.auth)

    expect(res.status).toBe(500)
    expect(res.headers['content-type']).not.toBe('application/pdf')
  })
})

describe('lab access to its own uploads', () => {
  it('lets the uploading lab download the file and audits it', async () => {
    const id = await uploadOk()

    const res = await request(app).get(`/api/lab/reports/${id}/file`).set('Authorization', lab.auth).buffer(true)

    expect(res.status).toBe(200)
    expect(Buffer.compare(res.body as Buffer, PDF)).toBe(0)
    const entry = await prisma.auditLog.findFirst({ where: { resource: `lab_report_file:${id}`, action: 'view' } })
    expect(entry).not.toBeNull()
  })

  it("returns 404 for another lab's report", async () => {
    const id = await uploadOk()
    const other = await createLab()

    const res = await request(app).get(`/api/lab/reports/${id}/file`).set('Authorization', other.auth)

    expect(res.status).toBe(404)
  })
})
