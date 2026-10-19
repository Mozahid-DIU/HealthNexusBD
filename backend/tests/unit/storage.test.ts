import { afterEach, describe, expect, it, vi } from 'vitest'
import { env } from '../../src/config/env.ts'

const uploadStream = vi.fn()
vi.mock('cloudinary', () => ({
  v2: {
    config: vi.fn(),
    uploader: { upload_stream: uploadStream, destroy: vi.fn().mockResolvedValue({}) },
  },
}))

const storage = await import('../../src/services/storage.ts')

afterEach(() => {
  vi.unstubAllGlobals()
  uploadStream.mockReset()
  env.CLOUDINARY_CLOUD_NAME = ''
  env.CLOUDINARY_API_KEY = ''
  env.CLOUDINARY_API_SECRET = ''
})

describe('downloadFile', () => {
  it('refuses non-https URLs without fetching', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    await expect(storage.downloadFile('http://res.cloudinary.com/x')).rejects.toThrow(/non-https/)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('does not follow redirects and uses a timeout', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response('ok'))
    vi.stubGlobal('fetch', fetchMock)

    await storage.downloadFile('https://res.cloudinary.com/x')

    expect(fetchMock.mock.calls[0][1]).toMatchObject({ redirect: 'error' })
    expect(fetchMock.mock.calls[0][1].signal).toBeInstanceOf(AbortSignal)
  })

  it('returns the body bytes', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(Buffer.from('abc'))))
    expect((await storage.downloadFile('https://res.cloudinary.com/x')).toString()).toBe('abc')
  })

  it('fails on an HTTP error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('nope', { status: 404 })))
    await expect(storage.downloadFile('https://res.cloudinary.com/x')).rejects.toThrow(/HTTP 404/)
  })

  it('rejects files over the size cap, by header or by streamed size', async () => {
    const tooBig = env.MAX_UPLOAD_MB * 1024 * 1024 + 2048
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response('x', { headers: { 'content-length': String(tooBig) } })),
    )
    await expect(storage.downloadFile('https://res.cloudinary.com/x')).rejects.toThrow(/size limit/)

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(Buffer.alloc(tooBig))))
    await expect(storage.downloadFile('https://res.cloudinary.com/x')).rejects.toThrow(/size limit/)
  })
})

describe('uploadRawFile', () => {
  it('fails clearly when Cloudinary is not configured', async () => {
    await expect(storage.uploadRawFile(Buffer.from('x'))).rejects.toThrow(/not configured/)
  })

  it('uploads as a raw file and returns its URL', async () => {
    env.CLOUDINARY_CLOUD_NAME = 'c'
    env.CLOUDINARY_API_KEY = 'k'
    env.CLOUDINARY_API_SECRET = 's'
    uploadStream.mockImplementation((opts, cb) => ({
      end: () => cb(null, { secure_url: 'https://res.cloudinary.com/c/raw/upload/v1/f', public_id: 'f', opts }),
    }))

    const result = await storage.uploadRawFile(Buffer.from('ciphertext'))

    expect(uploadStream.mock.calls[0][0]).toMatchObject({ resource_type: 'raw' })
    expect(result).toEqual({ url: 'https://res.cloudinary.com/c/raw/upload/v1/f', publicId: 'f' })
  })

  it('parses the public id back out of a raw URL', () => {
    expect(storage.publicIdFromRawUrl('https://res.cloudinary.com/c/raw/upload/v123/a/b.pdf')).toBe('a/b.pdf')
  })
})
