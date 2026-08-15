import crypto from 'node:crypto'
import { prisma } from '../config/prisma.ts'

/**
 * Generate a unique lifelong Unified Health ID in the format BD-YYYY-XXXXX.
 * Retries on the (rare) chance of a collision against the unique constraint.
 */
export async function generateUhid(): Promise<string> {
  const year = new Date().getFullYear()
  for (let attempt = 0; attempt < 8; attempt++) {
    const num = crypto.randomInt(0, 100000).toString().padStart(5, '0')
    const uhid = `BD-${year}-${num}`
    const existing = await prisma.patient.findUnique({ where: { uhid }, select: { id: true } })
    if (!existing) return uhid
  }
  throw new Error('Failed to generate a unique UHID after several attempts')
}
