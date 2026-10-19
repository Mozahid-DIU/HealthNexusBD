import type { Prisma, PrismaClient } from '@prisma/client'
import { env } from '../src/config/env.ts'

/**
 * Dev/test-only escape hatch for the append-only audit_logs table (see migration
 * 20261019120000_audit_log_append_only).
 *
 * Runs `fn` in one transaction with `app.audit_purge` switched on, so the seed refresh
 * and check scripts can delete the demo/test audit rows they created. The flag is
 * transaction-local (`set_config(..., true)`) and disappears on commit/rollback.
 * The application in src/ never calls this.
 */
export async function withAuditPurge<T>(
  prisma: PrismaClient,
  fn: (tx: Prisma.TransactionClient) => Promise<T>,
): Promise<T> {
  if (env.NODE_ENV === 'production') {
    throw new Error('Refusing to purge audit logs in production')
  }
  return prisma.$transaction(
    async (tx) => {
      await tx.$queryRaw`SELECT set_config('app.audit_purge', 'on', true)`
      return fn(tx)
    },
    { timeout: 30_000 },
  )
}
