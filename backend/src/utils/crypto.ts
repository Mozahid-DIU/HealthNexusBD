import crypto from 'node:crypto'
import { env } from '../config/env.ts'
import { logger } from './logger.ts'

/**
 * AES-256-GCM encryption for data at rest (medical record content, lab file refs).
 *
 * GCM gives us confidentiality AND integrity: a tampered ciphertext fails the auth
 * tag check on decrypt and throws, rather than returning garbage.
 *
 * Stored format:  <ivHex>:<authTagHex>:<cipherHex>
 *   - iv: a fresh 96-bit nonce per encryption (never reused with the same key)
 *   - authTag: 128-bit GCM tag
 *
 * Key comes from AES_SECRET_KEY (validated at startup as 64 hex chars = 32 bytes).
 */

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 12 // 96-bit nonce is the recommended size for GCM
const KEY = Buffer.from(env.AES_SECRET_KEY, 'hex')

export function encrypt(plaintext: string): string {
  const iv = crypto.randomBytes(IV_LENGTH)
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv)
  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const authTag = cipher.getAuthTag()
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${ciphertext.toString('hex')}`
}

export function decrypt(payload: string): string {
  const parts = payload.split(':')
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted payload format')
  }
  const [ivHex, tagHex, dataHex] = parts
  const iv = Buffer.from(ivHex, 'hex')
  const authTag = Buffer.from(tagHex, 'hex')
  const data = Buffer.from(dataHex, 'hex')

  const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv)
  decipher.setAuthTag(authTag)
  const plaintext = Buffer.concat([decipher.update(data), decipher.final()])
  return plaintext.toString('utf8')
}

/**
 * Decrypt without throwing — for list responses where one bad row should not
 * fail the whole request. Logs the failure and returns a safe placeholder.
 */
export function safeDecrypt(payload: string): string {
  try {
    return decrypt(payload)
  } catch (err) {
    logger.error({ err }, 'Failed to decrypt payload')
    return '[unable to decrypt]'
  }
}
