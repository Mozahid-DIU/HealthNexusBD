import crypto from 'node:crypto'

/**
 * In-memory stand-in for services/storage.ts (Cloudinary). Use with:
 *   vi.mock('../../src/services/storage.ts', () => import('../helpers/fake-storage.ts'))
 */
export const stored = new Map<string, Buffer>()
/** Every URL downloadFile was asked for, so tests can prove a guard stopped a fetch. */
export const downloadCalls: string[] = []

/** Bytes served for the seed's public sample PDF URL. */
export const SAMPLE_PDF_BYTES = Buffer.from('%PDF-1.4\n% sample\n%%EOF\n')

export async function uploadRawFile(buffer: Buffer) {
  const publicId = `healthnexus/lab-reports/${crypto.randomUUID()}`
  const url = `https://res.cloudinary.com/test/raw/upload/v1/${publicId}`
  stored.set(url, Buffer.from(buffer))
  return { url, publicId }
}

export async function downloadFile(url: string): Promise<Buffer> {
  downloadCalls.push(url)
  if (url.includes('w3.org')) return SAMPLE_PDF_BYTES
  const file = stored.get(url)
  if (!file) throw new Error(`fake storage: no object at ${url}`)
  return file
}

export async function deleteRawFile(): Promise<void> {}

export function publicIdFromRawUrl(url: string): string {
  return url.split('/upload/')[1] ?? ''
}
