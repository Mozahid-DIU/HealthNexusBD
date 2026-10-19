import { prisma } from '../../src/config/prisma.ts'

/**
 * Empty every table between tests. Refuses to run against anything but the local
 * test database, so a misconfigured env can never wipe Neon. audit_logs is
 * append-only, so the dev purge flag is set for this one transaction.
 */
export async function resetDb(): Promise<void> {
  const url = process.env.DATABASE_URL ?? ''
  if (!url.includes('@localhost:')) {
    throw new Error(`resetDb refused: DATABASE_URL is not the local test database (${url.split('@')[1]})`)
  }

  const rows = await prisma.$queryRaw<Array<{ tablename: string }>>`
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'public' AND tablename <> '_prisma_migrations'`
  const tables = rows.map((r) => `"public"."${r.tablename}"`).join(', ')

  await prisma.$transaction([
    prisma.$queryRaw`SELECT set_config('app.audit_purge', 'on', true)`,
    prisma.$executeRawUnsafe(`TRUNCATE TABLE ${tables} CASCADE`),
  ])
}
