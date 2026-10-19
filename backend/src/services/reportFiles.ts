import { decrypt, decryptBuffer, encrypt, encryptBuffer } from '../utils/crypto.ts'
import { downloadFile, uploadRawFile } from './storage.ts'

/**
 * Lab report files, encrypted at rest (SRS NFR: "lab files encrypted at rest, AES-256").
 *
 * Store:  PDF bytes -> AES-256-GCM -> Cloudinary (ciphertext only)
 *         its URL, tagged with ENCRYPTED_PREFIX, is AES-encrypted again into
 *         lab_reports.file_ref_encrypted
 * Read:   decrypt the ref -> download the ciphertext -> decrypt -> PDF bytes.
 *         Only the backend can do this, so files are served exclusively through
 *         authenticated endpoints — never as a public link.
 *
 * The one exception is the seed's public sample PDF (contains no patient data),
 * which is stored as a plain URL. Any other unprefixed ref is rejected, so a ref can
 * never be downgraded to point at an arbitrary unencrypted file.
 */

const ENCRYPTED_PREFIX = 'aes-gcm:v1:'
const STORAGE_HOST = 'res.cloudinary.com'

/** Public, patient-free sample PDF used by the demo seed. */
export const SAMPLE_REPORT_PDF_URL =
  'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'

/** Encrypt and upload a report PDF; returns the value for `fileRefEncrypted`. */
export async function storeReportFile(pdf: Buffer): Promise<string> {
  const { url } = await uploadRawFile(encryptBuffer(pdf))
  return encrypt(ENCRYPTED_PREFIX + url)
}

/** Resolve a stored `fileRefEncrypted` back to the original PDF bytes. */
export async function readReportFile(fileRefEncrypted: string): Promise<Buffer> {
  const ref = decrypt(fileRefEncrypted)

  if (ref.startsWith(ENCRYPTED_PREFIX)) {
    const url = ref.slice(ENCRYPTED_PREFIX.length)
    if (new URL(url).hostname !== STORAGE_HOST) {
      throw new Error('Encrypted report ref points outside file storage')
    }
    return decryptBuffer(await downloadFile(url))
  }
  if (ref === SAMPLE_REPORT_PDF_URL) {
    return downloadFile(ref)
  }
  throw new Error('Unrecognised lab report file ref')
}
