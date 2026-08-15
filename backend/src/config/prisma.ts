import { PrismaClient } from '@prisma/client'
import { isDev } from './env.ts'

/**
 * Single PrismaClient instance for the whole app (avoids connection exhaustion,
 * especially under dev hot-reload).
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: isDev ? ['warn', 'error'] : ['error'],
  })

if (isDev) globalForPrisma.prisma = prisma
