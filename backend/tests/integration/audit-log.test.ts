import { beforeEach, describe, expect, it } from 'vitest'
import { prisma } from '../../src/config/prisma.ts'
import { writeAudit } from '../../src/utils/audit.ts'
import { withAuditPurge } from '../../prisma/audit-purge.ts'
import { resetDb } from '../helpers/db.ts'
import { createAdmin } from '../helpers/factories.ts'

let entryId: string

beforeEach(async () => {
  await resetDb()
  const { user } = await createAdmin()
  await writeAudit({ actorUserId: user.id, action: 'view', resource: 'audit-test' })
  entryId = (await prisma.auditLog.findFirstOrThrow({ where: { resource: 'audit-test' } })).id
})

describe('audit_logs is append-only at the database level', () => {
  it('accepts new entries', async () => {
    expect(await prisma.auditLog.count()).toBe(1)
  })

  it('rejects UPDATE', async () => {
    await expect(
      prisma.auditLog.update({ where: { id: entryId }, data: { resource: 'tampered' } }),
    ).rejects.toThrow(/append-only/)
  })

  it('rejects DELETE', async () => {
    await expect(prisma.auditLog.delete({ where: { id: entryId } })).rejects.toThrow(/append-only/)
  })

  it('rejects raw SQL UPDATE and TRUNCATE', async () => {
    await expect(prisma.$executeRawUnsafe(`UPDATE audit_logs SET resource = 'x'`)).rejects.toThrow(/append-only/)
    await expect(prisma.$executeRawUnsafe('TRUNCATE audit_logs')).rejects.toThrow(/append-only/)
  })

  it('cannot be unlocked by setting the purge flag outside a transaction', async () => {
    await prisma.$queryRaw`SELECT set_config('app.audit_purge', 'on', true)`
    await expect(prisma.auditLog.delete({ where: { id: entryId } })).rejects.toThrow(/append-only/)
  })

  it('lets the dev purge delete only inside its own transaction', async () => {
    const { count } = await withAuditPurge(prisma, (tx) => tx.auditLog.deleteMany({}))
    expect(count).toBe(1)

    const { user } = await createAdmin()
    await writeAudit({ actorUserId: user.id, action: 'view' })
    await expect(prisma.auditLog.deleteMany({})).rejects.toThrow(/append-only/)
  })
})
