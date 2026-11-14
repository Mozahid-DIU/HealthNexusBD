/**
 * Adds the mock BMDC/DGHS registry numbers without touching accounts or clinical
 * data (the full seed rebuilds the demo patients' records). `npm run db:seed:registry`.
 */
import { PrismaClient } from '@prisma/client'
import { OPEN_DOCTOR_NUMBERS, OPEN_LAB_NUMBERS, seedRegistries } from './registry.ts'

const prisma = new PrismaClient()

async function main() {
  await seedRegistries(prisma)

  const doctors = await prisma.doctorRegistry.findMany({
    where: { bmdcNumber: { in: OPEN_DOCTOR_NUMBERS.map((d) => d.bmdcNumber) } },
    orderBy: { bmdcNumber: 'asc' },
  })
  const labs = await prisma.labRegistry.findMany({
    where: { licenseNumber: { in: OPEN_LAB_NUMBERS.map((l) => l.licenseNumber) } },
    orderBy: { licenseNumber: 'asc' },
  })

  console.log('\n✅ Registries up to date. Numbers kept free for a live registration demo:')
  for (const d of doctors) console.log(`   BMDC ${d.bmdcNumber}  ${d.fullName}  ${d.isClaimed ? '(already used)' : '(free)'}`)
  for (const l of labs) console.log(`   DGHS ${l.licenseNumber}  ${l.centerName}  ${l.isClaimed ? '(already used)' : '(free)'}`)
  console.log('')
}

main()
  .catch((err) => {
    console.error('Registry seed failed:', err)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
