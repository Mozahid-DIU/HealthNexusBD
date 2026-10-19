import { PrismaClient } from '@prisma/client'
import { env, isDev } from './env.ts'

/**
 * Single PrismaClient instance for the whole app (avoids connection exhaustion,
 * especially under dev hot-reload).
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    // Tests trigger expected errors (e.g. duplicate email → 409); keep their output clean.
    log: isDev ? ['warn', 'error'] : env.NODE_ENV === 'test' ? [] : ['error'],
    // The DB (Neon, us-east-2) is a long round-trip away, so a few sequential queries
    // can exceed Prisma's 5s interactive-transaction default and abort the request.
    transactionOptions: { maxWait: 10_000, timeout: 15_000 },
  })

if (isDev) globalForPrisma.prisma = prisma
