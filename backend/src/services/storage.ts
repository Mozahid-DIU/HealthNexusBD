import { v2 as cloudinary } from 'cloudinary'
import { env } from '../config/env.ts'

/**
 * Opaque file storage on Cloudinary. Callers hand in bytes that are ALREADY
 * AES-encrypted (see services/reportFiles.ts), so the stored object is ciphertext and
 * its URL alone reveals nothing. Uploads stream from memory (no local disk write).
 *
 * Files are stored as `resource_type: 'raw'` so they are delivered byte-for-byte.
 */

const UPLOAD_FOLDER = 'healthnexus/lab-reports'

let configured = false
function ensureConfigured(): void {
  if (!env.CLOUDINARY_CLOUD_NAME || !env.CLOUDINARY_API_KEY || !env.CLOUDINARY_API_SECRET) {
    throw new Error('Cloudinary is not configured — set CLOUDINARY_* in backend/.env')
  }
  if (!configured) {
    cloudinary.config({
      cloud_name: env.CLOUDINARY_CLOUD_NAME,
      api_key: env.CLOUDINARY_API_KEY,
      api_secret: env.CLOUDINARY_API_SECRET,
      secure: true,
    })
    configured = true
  }
}

export interface UploadResult {
  url: string
  publicId: string
}

export async function uploadRawFile(buffer: Buffer): Promise<UploadResult> {
  ensureConfigured()

  return new Promise<UploadResult>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { resource_type: 'raw', folder: UPLOAD_FOLDER, use_filename: false, unique_filename: true },
      (err, result) => {
        if (err || !result) {
          reject(err ?? new Error('Cloudinary upload failed'))
          return
        }
        resolve({ url: result.secure_url, publicId: result.public_id })
      },
    )
    stream.end(buffer)
  })
}

const DOWNLOAD_TIMEOUT_MS = 15_000
// Stored files are at most one upload plus the 28-byte GCM header; allow small slack.
const MAX_DOWNLOAD_BYTES = env.MAX_UPLOAD_MB * 1024 * 1024 + 1024

/**
 * Fetch a stored file's bytes over https, with a timeout, no redirects, and a hard
 * size cap so a slow or oversized object cannot pin server memory.
 */
export async function downloadFile(url: string): Promise<Buffer> {
  if (new URL(url).protocol !== 'https:') {
    throw new Error('Refusing to fetch a non-https storage URL')
  }
  const res = await fetch(url, { redirect: 'error', signal: AbortSignal.timeout(DOWNLOAD_TIMEOUT_MS) })
  if (!res.ok || !res.body) {
    throw new Error(`Storage download failed with HTTP ${res.status}`)
  }
  if (Number(res.headers.get('content-length') ?? 0) > MAX_DOWNLOAD_BYTES) {
    throw new Error('Stored file exceeds the size limit')
  }

  const chunks: Buffer[] = []
  let size = 0
  for await (const chunk of res.body) {
    size += chunk.length
    if (size > MAX_DOWNLOAD_BYTES) throw new Error('Stored file exceeds the size limit')
    chunks.push(Buffer.from(chunk))
  }
  return Buffer.concat(chunks)
}

/** Delete a raw file by its public id (used by tests / future report removal). */
export async function deleteRawFile(publicId: string): Promise<void> {
  ensureConfigured()
  await cloudinary.uploader.destroy(publicId, { resource_type: 'raw' })
}

/** Derive the public id from a stored raw-delivery URL. */
export function publicIdFromRawUrl(url: string): string {
  const afterUpload = url.split('/upload/')[1] ?? ''
  return afterUpload.replace(/^v\d+\//, '')
}
