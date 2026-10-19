import request from 'supertest'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp } from '../../src/app.ts'
import { prisma } from '../../src/config/prisma.ts'
import { sendSms } from '../../src/services/sms.ts'
import { sendFollowUpReminders } from '../../src/services/notifications.ts'
import { encrypt } from '../../src/utils/crypto.ts'
import { resetDb } from '../helpers/db.ts'
import { createDoctor, createLab, createPatient, createPrescription } from '../helpers/factories.ts'

vi.mock('../../src/services/storage.ts', () => import('../helpers/fake-storage.ts'))
vi.mock('../../src/services/sms.ts', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../src/services/sms.ts')>()),
  sendSms: vi.fn(async () => ({ delivered: false, mode: 'demo' as const })),
}))

const app = createApp()
const smsMock = vi.mocked(sendSms)
const PDF = Buffer.from('%PDF-1.4\n% report\n%%EOF\n')

type Patient = Awaited<ReturnType<typeof createPatient>>
let patient: Patient

beforeEach(async () => {
  await resetDb()
  smsMock.mockClear()
  smsMock.mockImplementation(async () => ({ delivered: false, mode: 'demo' }))
  patient = await createPatient()
})

const notifications = (auth = patient.auth) =>
  request(app).get('/api/patient/notifications').set('Authorization', auth)

async function uploadReport(testName = 'HIV Antibody') {
  const lab = await createLab()
  const { doctor } = await createDoctor()
  await createPrescription(patient.patient.id, doctor.id, [testName])
  return request(app)
    .post('/api/lab/reports')
    .set('Authorization', lab.auth)
    .field('uhid', patient.patient.uhid)
    .field('testName', testName)
    .attach('file', PDF, { filename: 'r.pdf', contentType: 'application/pdf' })
}

describe('new lab report notification', () => {
  it('adds an in-app notification naming the test', async () => {
    expect((await uploadReport()).status).toBe(201)

    const res = await notifications()

    expect(res.status).toBe(200)
    expect(res.body.data.unreadCount).toBe(1)
    expect(res.body.data.notifications[0]).toMatchObject({ type: 'lab_report', readAt: null })
    expect(res.body.data.notifications[0].body).toContain('HIV Antibody')
  })

  it('texts the patient without revealing the test name', async () => {
    await uploadReport()

    expect(smsMock).toHaveBeenCalledTimes(1)
    const [phone, message] = smsMock.mock.calls[0]
    expect(phone).toBe(patient.user.phone)
    expect(message).toMatch(/new lab report/i)
    expect(message).not.toContain('HIV')
  })

  it('still accepts the upload when the SMS gateway fails', async () => {
    smsMock.mockRejectedValue(new Error('gateway down'))

    const res = await uploadReport()

    expect(res.status).toBe(201)
    expect((await notifications()).body.data.unreadCount).toBe(1)
  })
})

describe('patient notification inbox', () => {
  it('only shows the patient their own notifications', async () => {
    await uploadReport()
    const other = await createPatient()

    const res = await notifications(other.auth)

    expect(res.body.data.notifications).toEqual([])
    expect(res.body.data.unreadCount).toBe(0)
  })

  it('marks one notification read', async () => {
    await uploadReport()
    const [n] = (await notifications()).body.data.notifications

    const res = await request(app).post(`/api/patient/notifications/${n.id}/read`).set('Authorization', patient.auth)

    expect(res.status).toBe(200)
    const after = (await notifications()).body.data
    expect(after.unreadCount).toBe(0)
    expect(after.notifications[0].readAt).not.toBeNull()
  })

  it('marks all notifications read', async () => {
    await uploadReport('CBC')
    await uploadReport('HbA1c')

    const res = await request(app).post('/api/patient/notifications/read-all').set('Authorization', patient.auth)

    expect(res.status).toBe(200)
    expect((await notifications()).body.data.unreadCount).toBe(0)
  })

  it("cannot mark another patient's notification read", async () => {
    await uploadReport()
    const [n] = (await notifications()).body.data.notifications
    const other = await createPatient()

    const res = await request(app).post(`/api/patient/notifications/${n.id}/read`).set('Authorization', other.auth)

    expect(res.status).toBe(404)
    expect((await notifications()).body.data.unreadCount).toBe(1)
  })
})

describe('follow-up reminders', () => {
  // 2026-03-10 is the "today" of these tests. Bangladesh is UTC+6, no DST.
  const dhaka = (isoLocal: string) => new Date(`${isoLocal}+06:00`)
  const day = (ymd: string) => new Date(`${ymd}T00:00:00Z`)

  async function recordWithFollowUp(ymd: string) {
    const { doctor } = await createDoctor()
    return prisma.medicalRecord.create({
      data: {
        patientId: patient.patient.id,
        doctorId: doctor.id,
        diagnosis: 'Hypertension',
        contentEncrypted: encrypt('note'),
        followUpDate: day(ymd),
      },
    })
  }

  it('waits until 9am the day before', async () => {
    await recordWithFollowUp('2026-03-11')

    const sent = await sendFollowUpReminders(dhaka('2026-03-10T08:59:00'))

    expect(sent).toBe(0)
    expect(smsMock).not.toHaveBeenCalled()
  })

  it('reminds the patient by SMS and in-app after 9am the day before', async () => {
    await recordWithFollowUp('2026-03-11')

    const sent = await sendFollowUpReminders(dhaka('2026-03-10T09:00:00'))

    expect(sent).toBe(1)
    expect(smsMock).toHaveBeenCalledTimes(1)
    expect(smsMock.mock.calls[0][1]).toContain('11 Mar 2026')
    const inbox = (await notifications()).body.data.notifications
    expect(inbox).toHaveLength(1)
    expect(inbox[0].type).toBe('follow_up')
  })

  it('sends each reminder only once, even across repeated runs', async () => {
    await recordWithFollowUp('2026-03-11')

    await sendFollowUpReminders(dhaka('2026-03-10T09:00:00'))
    await sendFollowUpReminders(dhaka('2026-03-10T10:00:00'))
    await sendFollowUpReminders(dhaka('2026-03-10T23:00:00'))

    expect(smsMock).toHaveBeenCalledTimes(1)
  })

  it('sends each reminder only once when two runs overlap', async () => {
    await recordWithFollowUp('2026-03-11')

    const results = await Promise.all([
      sendFollowUpReminders(dhaka('2026-03-10T09:00:00')),
      sendFollowUpReminders(dhaka('2026-03-10T09:00:00')),
    ])

    expect(results[0] + results[1]).toBe(1)
    expect(await prisma.notification.count()).toBe(1)
  })

  it('ignores follow-ups that are not tomorrow', async () => {
    await recordWithFollowUp('2026-03-10')
    await recordWithFollowUp('2026-03-12')
    await recordWithFollowUp('2026-03-09')

    expect(await sendFollowUpReminders(dhaka('2026-03-10T12:00:00'))).toBe(0)
  })

  it('uses the Bangladesh date, not the UTC date', async () => {
    // 01:00 on 11 Mar in Dhaka is still 10 Mar in UTC; tomorrow is 12 Mar.
    await recordWithFollowUp('2026-03-11')
    await recordWithFollowUp('2026-03-12')

    expect(await sendFollowUpReminders(dhaka('2026-03-11T10:00:00'))).toBe(1)
    expect(smsMock.mock.calls[0][1]).toContain('12 Mar 2026')
  })

  it('keeps going when one SMS fails, and still records the in-app reminder', async () => {
    await recordWithFollowUp('2026-03-11')
    smsMock.mockRejectedValue(new Error('gateway down'))

    const sent = await sendFollowUpReminders(dhaka('2026-03-10T09:30:00'))

    expect(sent).toBe(1)
    expect((await notifications()).body.data.unreadCount).toBe(1)
  })
})
