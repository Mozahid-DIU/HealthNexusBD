import { v2 as cloudinary } from 'cloudinary'
import { env } from '../config/env.ts'

/**
 * File storage on Cloudinary. Lab report PDFs are uploaded straight from memory
 * (no local disk write). Only the resulting URL is kept — and it is AES-encrypted
 * before it touches the database.
 *
 * PDFs are stored as `resource_type: 'raw'` so they are delivered verbatim and are
 * not subject to Cloudinary's image-PDF delivery restriction.
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

export async function uploadPdf(buffer: Buffer): Promise<UploadResult> {
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
