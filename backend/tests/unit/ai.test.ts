import { afterEach, describe, expect, it, vi } from 'vitest'
import { env } from '../../src/config/env.ts'
import { generateSummary, type SummaryContext } from '../../src/services/ai.ts'

const ctx: SummaryContext = {
  diagnosis: 'Community-acquired pneumonia',
  content: 'Fever and productive cough for 3 days.',
  symptoms: ['fever', 'cough'],
  medications: ['Amoxicillin 500mg', 'Metformin 500mg'],
  allergies: ['Penicillin'],
  chronic: ['Type 2 Diabetes'],
}

afterEach(() => {
  env.GEMINI_API_KEY = ''
  vi.unstubAllGlobals()
})

describe('AI summary — rule-based mode (no Gemini key)', () => {
  it('summarises the case', async () => {
    const r = await generateSummary(ctx)

    expect(r.model).toBe('demo-rule-based')
    expect(r.summary).toContain('Community-acquired pneumonia')
    expect(r.summary).toContain('Type 2 Diabetes')
  })

  it('flags a penicillin-family drug against a penicillin allergy', async () => {
    const r = await generateSummary(ctx)
    expect(r.allergyAlerts.join(' ')).toMatch(/Amoxicillin.*cross-react/)
  })

  it('applies single-drug and drug-pair interaction rules', async () => {
    const single = await generateSummary(ctx)
    const pair = await generateSummary({ ...ctx, medications: ['Aspirin 75mg', 'Warfarin 5mg'] })
    const none = await generateSummary({ ...ctx, medications: ['Aspirin 75mg'] })

    expect(single.interactionAlerts.join(' ')).toContain('Metformin')
    expect(pair.interactionAlerts.join(' ')).toContain('bleeding')
    expect(none.interactionAlerts).toEqual([])
  })
})

describe('AI summary — Gemini mode', () => {
  function stubGemini(response: Response) {
    const fetchMock = vi.fn().mockResolvedValue(response)
    vi.stubGlobal('fetch', fetchMock)
    env.GEMINI_API_KEY = 'test-key'
    return fetchMock
  }

  const geminiReply = (text: string) =>
    new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text }] } }] }), { status: 200 })

  it("uses Gemini's JSON answer", async () => {
    stubGemini(geminiReply(JSON.stringify({ summary: 'AI says hi', interactionAlerts: ['x'], allergyAlerts: [] })))

    const r = await generateSummary(ctx)

    expect(r).toMatchObject({ summary: 'AI says hi', interactionAlerts: ['x'], model: 'gemini-flash-latest' })
  })

  it('sends only clinical fields in the prompt', async () => {
    const fetchMock = stubGemini(geminiReply('{"summary":"ok"}'))

    await generateSummary(ctx)

    const body = String(fetchMock.mock.calls[0][1].body)
    expect(body).toContain('Community-acquired pneumonia')
    expect(body).not.toMatch(/BD-\d{4}-\d{5}|01\d{9}|\bNID\b/)
  })

  it('falls back to the rule-based summary when Gemini fails', async () => {
    stubGemini(new Response('quota exceeded', { status: 429 }))

    const r = await generateSummary(ctx)

    expect(r.model).toBe('demo-fallback')
    expect(r.allergyAlerts.length).toBeGreaterThan(0)
  })

  it('falls back when Gemini returns non-JSON text', async () => {
    stubGemini(geminiReply('not json at all'))
    expect((await generateSummary(ctx)).model).toBe('demo-fallback')
  })
})
