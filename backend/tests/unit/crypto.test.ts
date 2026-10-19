import { describe, expect, it } from 'vitest'
import { decrypt, decryptBuffer, encrypt, encryptBuffer, safeDecrypt } from '../../src/utils/crypto.ts'

describe('AES-256-GCM string encryption', () => {
  it('round-trips text, including Bangla', () => {
    const text = 'Diagnosis: Type 2 diabetes — ডায়াবেটিস'
    expect(decrypt(encrypt(text))).toBe(text)
  })

  it('uses a fresh IV, so the same input never produces the same ciphertext', () => {
    expect(encrypt('same')).not.toBe(encrypt('same'))
  })

  it('rejects a tampered ciphertext instead of returning garbage', () => {
    const [iv, tag, data] = encrypt('secret record').split(':')
    const flipped = (data[0] === '0' ? '1' : '0') + data.slice(1)
    expect(() => decrypt(`${iv}:${tag}:${flipped}`)).toThrow()
  })

  it('rejects a malformed payload', () => {
    expect(() => decrypt('not-encrypted')).toThrow('Invalid encrypted payload format')
  })

  it('safeDecrypt returns a placeholder instead of throwing', () => {
    expect(safeDecrypt('garbage')).toBe('[unable to decrypt]')
  })
})

describe('AES-256-GCM buffer encryption (lab report files)', () => {
  const pdf = Buffer.from('%PDF-1.4\n binary \x00\x01\x02 payload\n%%EOF')

  it('round-trips binary content', () => {
    expect(decryptBuffer(encryptBuffer(pdf)).equals(pdf)).toBe(true)
  })

  it('does not leave the plaintext readable in the ciphertext', () => {
    const enc = encryptBuffer(pdf)
    expect(enc.includes(Buffer.from('%PDF'))).toBe(false)
    expect(enc.includes(Buffer.from('payload'))).toBe(false)
  })

  it('rejects a tampered file', () => {
    const enc = encryptBuffer(pdf)
    enc[enc.length - 1] ^= 0xff
    expect(() => decryptBuffer(enc)).toThrow()
  })

  it('rejects a payload too short to hold IV and tag', () => {
    expect(() => decryptBuffer(Buffer.alloc(10))).toThrow('Invalid encrypted file payload')
  })
})
