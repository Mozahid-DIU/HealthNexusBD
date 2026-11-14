/**
 * Phone numbers of the seeded demo accounts (prisma/seed.ts). They are made up and
 * may well belong to real people, so a real SMS is never sent to them: the message is
 * only logged, exactly as in demo mode. Keep in step with the seed (a test checks).
 */
export const DEMO_PHONE_NUMBERS: ReadonlySet<string> = new Set([
  // Admin
  '01700000000',
  // Doctors
  '01710000001', '01710000002', '01710000003', '01710000004', '01710000005', '01710000006', '01710000007',
  // Labs
  '01720000001', '01720000002', '01720000003', '01720000004', '01720000005',
  // Patients (the first one is replaced by the owner's real number via SEED_OWNER_*)
  '01810000001', '01810000002', '01810000003', '01810000004', '01810000005', '01810000006', '01810000007', '01810000008',
])

export function isDemoNumber(phone: string): boolean {
  return DEMO_PHONE_NUMBERS.has(phone)
}
