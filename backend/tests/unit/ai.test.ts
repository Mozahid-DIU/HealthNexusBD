import { afterEach, describe, expect, it, vi } from 'vitest'
import { env } from '../../src/config/env.ts'
import { GEMINI_MODELS, deidentifyNote, generateOverview, generateSummary, type OverviewContext, type SummaryContext } from '../../src/services/ai.ts'

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

    expect(r).toMatchObject({ summary: 'AI says hi', model: GEMINI_MODELS[0] })
    expect(r.interactionAlerts).toContain('x') // alongside the rule-based alerts
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

describe('medicine side effects', () => {
  it('explains each known medicine in English and Bangla, and skips unknown ones', async () => {
    const r = await generateSummary({ ...ctx, medications: ['Metformin', 'Amlodipine', 'Unknownium'] })

    expect(r.sideEffects.map((s) => s.drug)).toEqual(['Metformin', 'Amlodipine'])
    for (const s of r.sideEffects) {
      expect(s.en.common.length).toBeGreaterThan(0)
      expect(s.en.serious.length).toBeGreaterThan(0)
      expect(s.bn.common.length).toBeGreaterThan(0)
      expect(s.bn.advice).toMatch(/[ঀ-৿]/) // Bangla script
    }
  })

  it('matches a medicine whatever its case or strength', async () => {
    const r = await generateSummary({ ...ctx, medications: ['METFORMIN 500mg'] })
    expect(r.sideEffects).toHaveLength(1)
    expect(r.sideEffects[0]?.drug).toBe('METFORMIN 500mg')
  })

  describe('with Gemini', () => {
    const effect = (drug: string, en: string, bn: string, advice = 'Take with food.') => ({
      drug,
      en: { common: [en], serious: ['Facial swelling'], advice },
      bn: { common: [bn], serious: ['মুখ ফুলে যাওয়া'], advice: 'খাবারের সাথে খান।' },
    })
    function geminiSays(sideEffects: unknown[], extra: object = {}) {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({ candidates: [{ content: { parts: [{ text: JSON.stringify({ summary: 'ok', sideEffects, ...extra }) }] } }] }),
          { status: 200 },
        ),
      ))
      env.GEMINI_API_KEY = 'test-key'
    }

    it('keeps the reviewed list for medicines it covers, whatever Gemini says', async () => {
      geminiSays([effect('Amoxicillin', 'Loose stools', 'পাতলা পায়খানা')])
      const r = await generateSummary(ctx)

      expect(r.sideEffects[0]).toMatchObject({ drug: 'Amoxicillin 500mg', source: 'reviewed' })
      expect(r.sideEffects[0]?.en.common).not.toContain('Loose stools')
    })

    it('uses Gemini only for a medicine the list does not cover, marked as AI-written', async () => {
      geminiSays([effect('Dapagliflozin', 'Thrush', 'ছত্রাক সংক্রমণ')])
      const r = await generateSummary({ ...ctx, medications: ['Dapagliflozin 10mg'] })

      expect(r.sideEffects).toEqual([expect.objectContaining({ drug: 'Dapagliflozin 10mg', source: 'ai' })])
      expect(r.sideEffects[0]?.en.common).toEqual(['Thrush'])
    })

    it('never attaches an entry to a different medicine ("Iron" is not "Spironolactone")', async () => {
      geminiSays([effect('Iron', 'Dark stools', 'গাঢ় পায়খানা')])
      const r = await generateSummary({ ...ctx, medications: ['Spironolactone 25mg'] })
      expect(r.sideEffects).toEqual([])
    })

    it('drops AI text that mentions stopping or dosing, or whose Bangla is not Bangla', async () => {
      geminiSays([
        effect('Dapagliflozin', 'Thrush', 'ছত্রাক সংক্রমণ', 'Stop it if you feel dizzy.'),
        { ...effect('Empagliflozin', 'Thrush', 'Thrush'), bn: { common: ['Thrush'], serious: ['Swelling'], advice: 'x' } },
        { drug: 'Sitagliptin', en: 'not an object' },
      ])
      const r = await generateSummary({ ...ctx, medications: ['Dapagliflozin', 'Empagliflozin', 'Sitagliptin'] })
      expect(r.sideEffects).toEqual([])
    })

    it('still runs the rule-based allergy and interaction checks', async () => {
      geminiSays([], { allergyAlerts: [], interactionAlerts: 'not a list' })
      const r = await generateSummary(ctx)

      expect(r.model).toBe(GEMINI_MODELS[0])
      expect(r.allergyAlerts.join(' ')).toMatch(/Amoxicillin.*cross-react/)
      expect(r.interactionAlerts.join(' ')).toContain('Metformin')
    })
  })

  it('asks Gemini for side effects in both languages', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: '{"summary":"ok"}' }] } }] }), { status: 200 }),
    )
    vi.stubGlobal('fetch', fetchMock)
    env.GEMINI_API_KEY = 'test-key'

    await generateSummary(ctx)

    const body = String(fetchMock.mock.calls[0][1].body)
    expect(body).toContain('sideEffects')
    expect(body).toMatch(/Bangla/)
  })
})

describe('whole-history overview', () => {
  const history: OverviewContext = {
    age: 57,
    gender: 'male',
    allergies: ['Penicillin'],
    chronic: ['Type 2 Diabetes', 'Hypertension'],
    totalVisits: 3,
    currentMedications: ['Amoxicillin', 'Metformin'],
    visits: [
      { month: '2026-10', diagnosis: 'Acute bronchitis', symptoms: ['cough'], medications: ['Amoxicillin', 'Metformin'] },
      { month: '2026-06', diagnosis: 'Hypertension review', symptoms: [], medications: ['Amlodipine'] },
      { month: '2026-01', diagnosis: 'Type 2 Diabetes review', symptoms: [], medications: ['Metformin'] },
    ],
    labTests: [{ month: '2026-10', test: 'CBC' }],
  }

  it('summarises the history without AI when there is no key', async () => {
    const r = await generateOverview(history)

    expect(r.model).toBe('demo-rule-based')
    expect(r.summary).toContain('Penicillin')
    expect(r.summary).toContain('Type 2 Diabetes')
    expect(r.summary).toContain('3 visits')
    expect(r.summary).toContain('Acute bronchitis')
    expect(r.summary).toContain('CBC')
  })

  it('warns when a current medicine clashes with a documented allergy', async () => {
    const r = await generateOverview(history)
    expect(r.alerts.join(' ')).toMatch(/Amoxicillin.*Penicillin/)
  })

  it('says plainly when there is no history yet', async () => {
    const r = await generateOverview({ ...history, totalVisits: 0, visits: [], labTests: [] })
    expect(r.summary).toMatch(/No visits/)
    expect(r.alerts).toEqual([])
  })

  it('sends Gemini clinical facts only and falls back when it fails', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response('quota exceeded', { status: 429 }))
    vi.stubGlobal('fetch', fetchMock)
    env.GEMINI_API_KEY = 'test-key'

    const r = await generateOverview(history)

    const body = String(fetchMock.mock.calls[0][1].body)
    expect(body).toContain('Acute bronchitis')
    expect(body).not.toMatch(/BD-\d{4}-\d{5}|01\d{9}|\bNID\b|@/)
    expect(r.model).toBe('demo-fallback')
    expect(r.summary).toContain('Penicillin')
  })
})

describe('safety rules', () => {
  it('flags any single ACE inhibitor or ARB, not only a pair of them', async () => {
    const r = await generateSummary({ ...ctx, medications: ['Losartan 50mg'] })
    expect(r.interactionAlerts.join(' ')).toMatch(/potassium/)
  })

  it('checks medicines from different recent visits together', async () => {
    const r = await generateOverview({
      age: null, gender: null, allergies: [], chronic: [], totalVisits: 2, labTests: [],
      currentMedications: ['Warfarin', 'Aspirin'],
      visits: [
        { month: '2026-11', diagnosis: 'Chest pain', symptoms: [], medications: ['Aspirin'] },
        { month: '2026-10', diagnosis: 'Atrial fibrillation', symptoms: [], medications: ['Warfarin'] },
      ],
    })
    expect(r.alerts.join(' ')).toMatch(/bleeding/)
  })

  it('removes the patient name and any identifier from a clinical note', () => {
    const note = 'Rahim Uddin (BD-2026-01234, NID 1990123456781) called from 01810000001, rahim@hn.bd. Fever 3 days.'
    const clean = deidentifyNote(note, ['Rahim Uddin'])

    expect(clean).toBe('[patient] [patient] ([id], NID [id]) called from [phone], [email]. Fever 3 days.')
  })

  it('sends the Gemini key in a header, never in the URL', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: '{"summary":"ok"}' }] } }] }), { status: 200 }),
    )
    vi.stubGlobal('fetch', fetchMock)
    env.GEMINI_API_KEY = 'test-key'

    await generateSummary(ctx)

    const [url, init] = fetchMock.mock.calls[0]
    expect(String(url)).not.toContain('test-key')
    expect(init.headers['x-goog-api-key']).toBe('test-key')
  })
})

describe('Gemini model fallback', () => {
  const ok = () =>
    new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: '{"summary":"from the backup model"}' }] } }] }), { status: 200 })

  it('moves to the next model when the first is busy, and records which one answered', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response('busy', { status: 503 }))
      .mockResolvedValueOnce(ok())
    vi.stubGlobal('fetch', fetchMock)
    env.GEMINI_API_KEY = 'test-key'

    const r = await generateSummary(ctx)

    expect(r.summary).toBe('from the backup model')
    expect(r.model).toBe(GEMINI_MODELS[1])
    expect(String(fetchMock.mock.calls[0][0])).toContain(GEMINI_MODELS[0])
    expect(String(fetchMock.mock.calls[1][0])).toContain(GEMINI_MODELS[1])
  })

  it('gives every model a time limit, so a hung model never blocks the doctor', async () => {
    const fetchMock = vi.fn().mockResolvedValue(ok())
    vi.stubGlobal('fetch', fetchMock)
    env.GEMINI_API_KEY = 'test-key'

    await generateSummary(ctx)

    expect(fetchMock.mock.calls[0][1].signal).toBeInstanceOf(AbortSignal)
  })

  it('falls back to the rules only when every model fails', async () => {
    const fetchMock = vi.fn().mockRejectedValue(Object.assign(new Error('timed out'), { name: 'TimeoutError' }))
    vi.stubGlobal('fetch', fetchMock)
    env.GEMINI_API_KEY = 'test-key'

    const r = await generateOverview({
      age: null, gender: null, allergies: ['Penicillin'], chronic: [], totalVisits: 1, labTests: [],
      currentMedications: [], visits: [{ month: '2026-11', diagnosis: 'Flu', symptoms: [], medications: [] }],
    })

    expect(fetchMock).toHaveBeenCalledTimes(GEMINI_MODELS.length)
    expect(r.model).toBe('demo-fallback')
  })
})

describe('de-identifying lab-report text', () => {
  it('drops identity header lines and catches IDs written with spaces, dashes or Bangla digits', () => {
    const text = [
      'Patient Name : Md. Rahim Uddin',
      'Age: 57 Y   Sex: M',
      'Mobile: +880 1711-123456',
      'Ref. by: Dr. Karim',
      'রোগীর নাম: মোঃ রহিম উদ্দিন',
      'ফোন: ০১৭১১-১২৩৪৫৬',
      'NID 1990 1234 56781',
      'Haemoglobin 13.9 g/dL (13.0 - 17.0)',
    ].join('\n')

    const clean = deidentifyNote(text, ['Rahim Uddin'])

    expect(clean).not.toMatch(/Rahim|রহিম|1711|১৭১১|Karim|1990 1234/)
    expect(clean).toContain('Age: 57 Y')
    expect(clean).toContain('Haemoglobin 13.9 g/dL (13.0 - 17.0)')
  })

  it('removes a Bangla-script name as a whole word only', () => {
    expect(deidentifyNote('রহিম উদ্দিন called; Rahimpur road', ['রহিম উদ্দিন', 'Rahim'])).toBe('[patient] [patient] called; Rahimpur road')
  })
})
