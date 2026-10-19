import crypto from 'node:crypto'
import { prisma } from '../../src/config/prisma.ts'
import { hashPassword } from '../../src/utils/password.ts'
import { signAccessToken } from '../../src/utils/jwt.ts'

export const TEST_PASSWORD = 'Test@1234'

// bcrypt at cost 12 is slow; hash once and reuse for every factory user.
let passwordHash: Promise<string> | null = null
const getHash = () => (passwordHash ??= hashPassword(TEST_PASSWORD))

let seq = 0
function next() {
  seq += 1
  return `${Date.now().toString().slice(-5)}${String(seq).padStart(3, '0')}`
}
const phone = (n: string) => `017${n.padStart(8, '0').slice(-8)}`

type Status = 'active' | 'pending' | 'suspended'

function bearer(user: { id: string; role: 'patient' | 'doctor' | 'lab' | 'admin' }) {
  return `Bearer ${signAccessToken({ sub: user.id, role: user.role })}`
}

export async function createPatient(opts: { status?: Status } = {}) {
  const n = next()
  const user = await prisma.user.create({
    data: {
      email: `patient${n}@test.bd`,
      phone: phone(n),
      passwordHash: await getHash(),
      role: 'patient',
      status: opts.status ?? 'active',
      patient: {
        create: {
          uhid: `BD-2026-${crypto.randomInt(0, 100000).toString().padStart(5, '0')}`,
          nid: `1990${n}`.padEnd(13, '0'),
          fullName: `Test Patient ${n}`,
        },
      },
    },
    include: { patient: true },
  })
  return { user, patient: user.patient!, auth: bearer(user) }
}

export async function createDoctor(opts: { status?: Status } = {}) {
  const n = next()
  const user = await prisma.user.create({
    data: {
      email: `doctor${n}@test.bd`,
      phone: phone(n),
      passwordHash: await getHash(),
      role: 'doctor',
      status: opts.status ?? 'active',
      doctor: {
        create: { bmdcNumber: `T-${n}`, fullName: `Dr. Test ${n}`, specialization: 'General Physician' },
      },
    },
    include: { doctor: true },
  })
  return { user, doctor: user.doctor!, auth: bearer(user) }
}

export async function createLab(opts: { status?: Status } = {}) {
  const n = next()
  const status = opts.status ?? 'active'
  const user = await prisma.user.create({
    data: {
      email: `lab${n}@test.bd`,
      phone: phone(n),
      passwordHash: await getHash(),
      role: 'lab',
      status,
      lab: {
        create: { licenseNumber: `LAB-${n}`, centerName: `Test Lab ${n}`, isApproved: status === 'active' },
      },
    },
    include: { lab: true },
  })
  return { user, lab: user.lab!, auth: bearer(user) }
}

export async function createAdmin() {
  const n = next()
  const user = await prisma.user.create({
    data: {
      email: `admin${n}@test.bd`,
      phone: phone(n),
      passwordHash: await getHash(),
      role: 'admin',
      status: 'active',
      admin: { create: { fullName: `Admin ${n}` } },
    },
    include: { admin: true },
  })
  return { user, admin: user.admin!, auth: bearer(user) }
}

/** An active consent session, as if the patient had shared a valid OTP. */
export async function grantSession(doctorId: string, patientId: string, minutes = 30) {
  return prisma.accessSession.create({
    data: { doctorId, patientId, expiresAt: new Date(Date.now() + minutes * 60_000) },
  })
}

/** A medical record + prescription recommending `tests`, so labs may upload for them. */
export async function createPrescription(patientId: string, doctorId: string, tests: string[]) {
  const record = await prisma.medicalRecord.create({
    data: { patientId, doctorId, contentEncrypted: 'n/a' },
  })
  await prisma.prescription.create({
    data: { recordId: record.id, medications: [], recommendedTests: tests },
  })
  return record
}
