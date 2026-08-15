/**
 * Seed — verification registries + a full demo dataset.
 *
 * Idempotent: accounts are upserted by email (stable ids, password preserved),
 * registries are upserted by number, and clinical data is wiped + rebuilt for the
 * demo patients on each run. Safe to run repeatedly: `npm run db:seed`.
 *
 * All demo accounts share one password: Demo@1234 (change before any real use).
 */
import { PrismaClient } from '@prisma/client'
import type { UserStatus } from '@prisma/client'
import { hashPassword } from '../src/utils/password.ts'
import { seedClinical } from './seed-clinical.ts'
import type { SeededDoctor, SeededPatient } from './seed-clinical.ts'

const prisma = new PrismaClient()
const DEMO_PASSWORD = 'Demo@1234'

// --- Mock BMDC registry (includes one extra number for a pending doctor) ---
const DOCTOR_REGISTRY = [
  { bmdcNumber: 'A-29871', fullName: 'Dr. Ayesha Karim', specialization: 'Cardiologist' },
  { bmdcNumber: 'A-31245', fullName: 'Dr. Tanvir Ahmed', specialization: 'Internal Medicine' },
  { bmdcNumber: 'A-28110', fullName: 'Dr. Nusrat Jahan', specialization: 'Endocrinologist' },
  { bmdcNumber: 'A-33902', fullName: 'Dr. Sabbir Hossain', specialization: 'Nephrologist' },
  { bmdcNumber: 'A-30567', fullName: 'Dr. Farhana Islam', specialization: 'Pediatrician' },
  { bmdcNumber: 'A-27654', fullName: 'Dr. Imran Kabir', specialization: 'General Physician' },
  { bmdcNumber: 'A-40012', fullName: 'Dr. Ritu Barua', specialization: 'Dermatologist' },
]

// --- Mock DGHS registry (includes one extra for a pending lab) ---
const LAB_REGISTRY = [
  { licenseNumber: 'DGHS-LAB-0099', centerName: 'PathCare Diagnostics', address: 'Dhanmondi, Dhaka' },
  { licenseNumber: 'DGHS-LAB-0142', centerName: 'Popular Diagnostic Center', address: 'Shyamoli, Dhaka' },
  { licenseNumber: 'DGHS-LAB-0210', centerName: 'Ibn Sina Lab', address: 'Mirpur, Dhaka' },
  { licenseNumber: 'DGHS-LAB-0301', centerName: 'LabAid Diagnostics', address: 'Chittagong' },
  { licenseNumber: 'DGHS-LAB-0410', centerName: 'Medinova Diagnostics', address: 'Malibagh, Dhaka' },
]

const ADMIN = { email: 'admin@healthnexus.bd', phone: '01700000000', fullName: 'System Admin' }

interface DoctorSeed {
  email: string
  phone: string
  bmdc: string
  name: string
  spec: string
}

const DOCTORS: DoctorSeed[] = [
  { email: 'ayesha.karim@hn.bd', phone: '01710000001', bmdc: 'A-29871', name: 'Dr. Ayesha Karim', spec: 'Cardiologist' },
  { email: 'tanvir.ahmed@hn.bd', phone: '01710000002', bmdc: 'A-31245', name: 'Dr. Tanvir Ahmed', spec: 'Internal Medicine' },
  { email: 'nusrat.jahan@hn.bd', phone: '01710000003', bmdc: 'A-28110', name: 'Dr. Nusrat Jahan', spec: 'Endocrinologist' },
  { email: 'sabbir.hossain@hn.bd', phone: '01710000004', bmdc: 'A-33902', name: 'Dr. Sabbir Hossain', spec: 'Nephrologist' },
  { email: 'farhana.islam@hn.bd', phone: '01710000005', bmdc: 'A-30567', name: 'Dr. Farhana Islam', spec: 'Pediatrician' },
  { email: 'imran.kabir@hn.bd', phone: '01710000006', bmdc: 'A-27654', name: 'Dr. Imran Kabir', spec: 'General Physician' },
]
const PENDING_DOCTOR: DoctorSeed = {
  email: 'ritu.barua@hn.bd', phone: '01710000007', bmdc: 'A-40012', name: 'Dr. Ritu Barua', spec: 'Dermatologist',
}

interface LabSeed {
  email: string
  phone: string
  license: string
  center: string
  address: string
}

const LABS: LabSeed[] = [
  { email: 'pathcare@hn.bd', phone: '01720000001', license: 'DGHS-LAB-0099', center: 'PathCare Diagnostics', address: 'Dhanmondi, Dhaka' },
  { email: 'popular@hn.bd', phone: '01720000002', license: 'DGHS-LAB-0142', center: 'Popular Diagnostic Center', address: 'Shyamoli, Dhaka' },
  { email: 'ibnsina@hn.bd', phone: '01720000003', license: 'DGHS-LAB-0210', center: 'Ibn Sina Lab', address: 'Mirpur, Dhaka' },
  { email: 'labaid@hn.bd', phone: '01720000004', license: 'DGHS-LAB-0301', center: 'LabAid Diagnostics', address: 'Chittagong' },
]
const PENDING_LAB: LabSeed = {
  email: 'medinova@hn.bd', phone: '01720000005', license: 'DGHS-LAB-0410', center: 'Medinova Diagnostics', address: 'Malibagh, Dhaka',
}

interface PatientSeed {
  email: string
  phone: string
  uhid: string
  nid: string
  name: string
  blood: string
  allergies: string[]
  chronic: string[]
  dob: string
  gender: string
}

const PATIENTS: PatientSeed[] = [
  { email: 'rahim@hn.bd', phone: '01810000001', uhid: 'BD-2026-01234', nid: '1990123456781', name: 'Rahim Uddin', blood: 'B+', allergies: ['Penicillin', 'Peanuts'], chronic: ['Type 2 Diabetes', 'Hypertension'], dob: '1969-05-12', gender: 'male' },
  { email: 'karim@hn.bd', phone: '01810000002', uhid: 'BD-2026-01235', nid: '1990123456782', name: 'Karim Ahmed', blood: 'O+', allergies: [], chronic: ['Asthma'], dob: '1985-02-20', gender: 'male' },
  { email: 'fatema@hn.bd', phone: '01810000003', uhid: 'BD-2026-01236', nid: '1990123456783', name: 'Fatema Begum', blood: 'A+', allergies: ['Sulfa drugs'], chronic: ['Hypothyroidism'], dob: '1978-11-03', gender: 'female' },
  { email: 'jamal@hn.bd', phone: '01810000004', uhid: 'BD-2026-01237', nid: '1990123456784', name: 'Jamal Hossain', blood: 'AB+', allergies: [], chronic: ['CKD Stage 2'], dob: '1962-07-19', gender: 'male' },
  { email: 'ayesha.s@hn.bd', phone: '01810000005', uhid: 'BD-2026-01238', nid: '1990123456785', name: 'Ayesha Siddika', blood: 'O-', allergies: ['Latex'], chronic: [], dob: '1995-09-30', gender: 'female' },
  { email: 'sohel@hn.bd', phone: '01810000006', uhid: 'BD-2026-01239', nid: '1990123456786', name: 'Sohel Rana', blood: 'B-', allergies: ['Aspirin'], chronic: ['Hypertension'], dob: '1972-01-25', gender: 'male' },
  { email: 'nasrin@hn.bd', phone: '01810000007', uhid: 'BD-2026-01240', nid: '1990123456787', name: 'Nasrin Akter', blood: 'A-', allergies: [], chronic: ['Type 1 Diabetes'], dob: '2000-03-14', gender: 'female' },
  { email: 'mizan@hn.bd', phone: '01810000008', uhid: 'BD-2026-01241', nid: '1990123456788', name: 'Mizanur Rahman', blood: 'O+', allergies: ['Penicillin'], chronic: ['Dyslipidemia'], dob: '1980-06-08', gender: 'male' },
]

async function seedRegistries() {
  for (const d of DOCTOR_REGISTRY) {
    await prisma.doctorRegistry.upsert({
      where: { bmdcNumber: d.bmdcNumber },
      update: { fullName: d.fullName, specialization: d.specialization },
      create: d,
    })
  }
  for (const l of LAB_REGISTRY) {
    await prisma.labRegistry.upsert({
      where: { licenseNumber: l.licenseNumber },
      update: { centerName: l.centerName, address: l.address },
      create: l,
    })
  }
}

async function seedAdmin() {
  const existing = await prisma.user.findUnique({ where: { email: ADMIN.email } })
  if (existing) return
  const passwordHash = await hashPassword(DEMO_PASSWORD)
  await prisma.user.create({
    data: {
      email: ADMIN.email, phone: ADMIN.phone, passwordHash, role: 'admin', status: 'active',
      admin: { create: { fullName: ADMIN.fullName, adminLevel: 'super' } },
    },
  })
}

async function seedDoctor(d: DoctorSeed, status: UserStatus): Promise<SeededDoctor> {
  const passwordHash = await hashPassword(DEMO_PASSWORD)
  const active = status === 'active'
  const user = await prisma.user.upsert({
    where: { email: d.email },
    update: { status },
    create: {
      email: d.email, phone: d.phone, passwordHash, role: 'doctor', status,
      doctor: {
        create: {
          bmdcNumber: d.bmdc, fullName: d.name, specialization: d.spec,
          isBmdcVerified: active, approvedAt: active ? new Date() : null,
        },
      },
    },
    include: { doctor: true },
  })
  await prisma.doctorRegistry.updateMany({
    where: { bmdcNumber: d.bmdc },
    data: { isClaimed: true, claimedByUserId: user.id },
  })
  return { userId: user.id, doctorId: user.doctor!.id, name: d.name }
}

async function seedLab(l: LabSeed, status: UserStatus) {
  const passwordHash = await hashPassword(DEMO_PASSWORD)
  const user = await prisma.user.upsert({
    where: { email: l.email },
    update: { status },
    create: {
      email: l.email, phone: l.phone, passwordHash, role: 'lab', status,
      lab: {
        create: { licenseNumber: l.license, centerName: l.center, address: l.address, isApproved: status === 'active' },
      },
    },
  })
  await prisma.labRegistry.updateMany({
    where: { licenseNumber: l.license },
    data: { isClaimed: true, claimedByUserId: user.id },
  })
}

async function seedPatient(p: PatientSeed): Promise<SeededPatient> {
  const passwordHash = await hashPassword(DEMO_PASSWORD)
  const user = await prisma.user.upsert({
    where: { email: p.email },
    update: {},
    create: {
      email: p.email, phone: p.phone, passwordHash, role: 'patient', status: 'active',
      patient: {
        create: {
          uhid: p.uhid, nid: p.nid, fullName: p.name, bloodGroup: p.blood,
          dateOfBirth: new Date(p.dob), gender: p.gender,
          allergies: p.allergies, chronicDiseases: p.chronic,
        },
      },
    },
    include: { patient: true },
  })
  return { id: user.patient!.id, uhid: p.uhid, name: p.name }
}

async function main() {
  await seedRegistries()
  await seedAdmin()

  const doctors: SeededDoctor[] = []
  for (const d of DOCTORS) doctors.push(await seedDoctor(d, 'active'))
  await seedDoctor(PENDING_DOCTOR, 'pending')

  for (const l of LABS) await seedLab(l, 'active')
  await seedLab(PENDING_LAB, 'pending')

  const patients: SeededPatient[] = []
  for (const p of PATIENTS) patients.push(await seedPatient(p))

  const clinical = await seedClinical(prisma, doctors, patients)

  console.log('\n✅ Seed complete')
  console.log(`   Registries : ${DOCTOR_REGISTRY.length} BMDC, ${LAB_REGISTRY.length} DGHS`)
  console.log(`   Accounts   : 1 admin, ${DOCTORS.length} doctors (+1 pending), ${LABS.length} labs (+1 pending), ${PATIENTS.length} patients`)
  console.log(`   Clinical   : ${clinical.records} records, ${clinical.prescriptions} prescriptions, ${clinical.labReports} lab reports, ${clinical.summaries} AI summaries`)
  console.log(`   Login      : any account above with password  ${DEMO_PASSWORD}`)
  console.log(`   Admin      : ${ADMIN.email}\n`)
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (err) => {
    console.error('❌ Seed failed:', err)
    await prisma.$disconnect()
    process.exit(1)
  })
