/**
 * Mock verification registries: the BMDC (doctors) and DGHS (labs) numbers a
 * registration is checked against. Shared by the full seed and `npm run db:seed:registry`.
 */
import type { PrismaClient } from '@prisma/client'

export interface DoctorRegistryEntry {
  bmdcNumber: string
  fullName: string
  specialization: string
}

export interface LabRegistryEntry {
  licenseNumber: string
  centerName: string
  address: string
}

// Claimed by the seeded demo doctors (the last one by the pending doctor).
const SEEDED_DOCTORS: DoctorRegistryEntry[] = [
  { bmdcNumber: 'A-29871', fullName: 'Dr. Ayesha Karim', specialization: 'Cardiologist' },
  { bmdcNumber: 'A-31245', fullName: 'Dr. Tanvir Ahmed', specialization: 'Internal Medicine' },
  { bmdcNumber: 'A-28110', fullName: 'Dr. Nusrat Jahan', specialization: 'Endocrinologist' },
  { bmdcNumber: 'A-33902', fullName: 'Dr. Sabbir Hossain', specialization: 'Nephrologist' },
  { bmdcNumber: 'A-30567', fullName: 'Dr. Farhana Islam', specialization: 'Pediatrician' },
  { bmdcNumber: 'A-27654', fullName: 'Dr. Imran Kabir', specialization: 'General Physician' },
  { bmdcNumber: 'A-40012', fullName: 'Dr. Ritu Barua', specialization: 'Dermatologist' },
]

/** Left unclaimed on purpose: free numbers for registering a new doctor live in a demo. */
export const OPEN_DOCTOR_NUMBERS: DoctorRegistryEntry[] = [
  { bmdcNumber: 'A-45101', fullName: 'Dr. Shahana Parvin', specialization: 'Gynaecologist' },
  { bmdcNumber: 'A-45102', fullName: 'Dr. Mahmudul Hasan', specialization: 'Orthopaedic Surgeon' },
  { bmdcNumber: 'A-45103', fullName: 'Dr. Tasnim Chowdhury', specialization: 'Psychiatrist' },
]

// Claimed by the seeded demo labs (the last one by the pending lab).
const SEEDED_LABS: LabRegistryEntry[] = [
  { licenseNumber: 'DGHS-LAB-0099', centerName: 'PathCare Diagnostics', address: 'Dhanmondi, Dhaka' },
  { licenseNumber: 'DGHS-LAB-0142', centerName: 'Popular Diagnostic Center', address: 'Shyamoli, Dhaka' },
  { licenseNumber: 'DGHS-LAB-0210', centerName: 'Ibn Sina Lab', address: 'Mirpur, Dhaka' },
  { licenseNumber: 'DGHS-LAB-0301', centerName: 'LabAid Diagnostics', address: 'Chittagong' },
  { licenseNumber: 'DGHS-LAB-0410', centerName: 'Medinova Diagnostics', address: 'Malibagh, Dhaka' },
]

/** Left unclaimed on purpose: free licence numbers for registering a new lab live in a demo. */
export const OPEN_LAB_NUMBERS: LabRegistryEntry[] = [
  { licenseNumber: 'DGHS-LAB-0511', centerName: 'Prottasha Diagnostics', address: 'Uttara, Dhaka' },
  { licenseNumber: 'DGHS-LAB-0512', centerName: 'Sebaghor Pathology', address: 'Zindabazar, Sylhet' },
  { licenseNumber: 'DGHS-LAB-0513', centerName: 'NorthStar Lab & Imaging', address: 'Shaheb Bazar, Rajshahi' },
]

export const DOCTOR_REGISTRY: DoctorRegistryEntry[] = [...SEEDED_DOCTORS, ...OPEN_DOCTOR_NUMBERS]
export const LAB_REGISTRY: LabRegistryEntry[] = [...SEEDED_LABS, ...OPEN_LAB_NUMBERS]

/**
 * Upsert every registry entry by its number. Claims are never touched: a number
 * someone already registered with stays claimed.
 */
export async function seedRegistries(prisma: PrismaClient): Promise<void> {
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
