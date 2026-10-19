import request from 'supertest'
import { describe, expect, it } from 'vitest'
import { createApp } from '../../src/app.ts'

describe('GET /api/health', () => {
  it('reports the API up and the test database connected', async () => {
    const res = await request(createApp()).get('/api/health')

    expect(res.status).toBe(200)
    expect(res.body.data).toMatchObject({ status: 'ok', database: 'connected' })
  })

  it('returns 404 in the standard envelope for unknown routes', async () => {
    const res = await request(createApp()).get('/api/does-not-exist')

    expect(res.status).toBe(404)
    expect(res.body).toMatchObject({ success: false, data: null })
  })
})
