import { env } from '../config/env.ts'
import { logger } from '../utils/logger.ts'

/**
 * Clinical summary generation.
 *
 * Two modes, chosen by whether GEMINI_API_KEY is set:
 *   - real: calls Google Gemini with a DE-IDENTIFIED case (no name/UHID/NID/phone).
 *   - demo: a deterministic rule-based summary + alerts, so the feature works with
 *     no key and as a safe fallback if the API call fails.
 *
 * Input is de-identified by the caller — only clinical fields reach this service.
 */

export interface SummaryContext {
  diagnosis: string | null
  content: string
  symptoms: string[]
  medications: string[]
  allergies: string[]
  chronic: string[]
}

export interface SummaryResult {
  summary: string
  interactionAlerts: string[]
  allergyAlerts: string[]
  model: string
}

// "…-latest" tracks the current stable Flash model, so this won't 404 as models roll over.
const GEMINI_MODEL = 'gemini-flash-latest'

// --- Small rule base for the demo mode (and as an always-on safety net) ---

const PENICILLIN_FAMILY = ['penicillin', 'amoxicillin', 'ampicillin', 'flucloxacillin', 'co-amoxiclav']

const INTERACTION_RULES: Array<{ drugs: string[]; alert: string }> = [
  { drugs: ['metformin'], alert: 'Metformin: monitor renal function; withhold before iodinated-contrast studies.' },
  { drugs: ['losartan', 'ramipril', 'enalapril'], alert: 'ACE inhibitor / ARB: monitor serum potassium and renal function.' },
  { drugs: ['amlodipine', 'simvastatin'], alert: 'Amlodipine + Simvastatin: limit simvastatin to 20 mg/day (interaction).' },
  { drugs: ['aspirin', 'warfarin'], alert: 'Aspirin + Warfarin: increased bleeding risk — review necessity.' },
  { drugs: ['atorvastatin'], alert: 'Statin: check LFTs at baseline; counsel on muscle symptoms.' },
]

function buildDemoSummary(ctx: SummaryContext): SummaryResult {
  const meds = ctx.medications.filter(Boolean)
  const medsLower = meds.map((m) => m.toLowerCase())

  const parts: string[] = []
  parts.push(`Working diagnosis: ${ctx.diagnosis ?? 'not specified'}.`)
  if (ctx.chronic.length) parts.push(`Background: ${ctx.chronic.join(', ')}.`)
  if (ctx.symptoms.length) parts.push(`Presenting with ${ctx.symptoms.join(', ')}.`)
  parts.push(meds.length ? `Current management: ${meds.join(', ')}.` : 'No active medications recorded.')
  const summary = parts.join(' ')

  // Allergy alerts: list documented allergies + flag likely drug cross-reactions.
  const allergyAlerts: string[] = []
  for (const a of ctx.allergies) {
    allergyAlerts.push(`Documented allergy: ${a} — avoid ${a} and cross-reactive agents.`)
    if (a.toLowerCase().includes('penicillin')) {
      const clash = meds.find((m) => PENICILLIN_FAMILY.some((p) => m.toLowerCase().includes(p)))
      if (clash) allergyAlerts.push(`⚠ ${clash} may cross-react with a documented Penicillin allergy.`)
    }
  }

  // Interaction alerts from the rule base.
  const interactionAlerts: string[] = []
  for (const rule of INTERACTION_RULES) {
    const matched = rule.drugs.filter((d) => medsLower.some((m) => m.includes(d)))
    // single-drug caution needs one match; pair rules need two.
    if ((rule.drugs.length === 1 && matched.length >= 1) || (rule.drugs.length > 1 && matched.length >= 2)) {
      interactionAlerts.push(rule.alert)
    }
  }

  return { summary, interactionAlerts, allergyAlerts, model: 'demo-rule-based' }
}

// --- Gemini call ---

function buildPrompt(ctx: SummaryContext): string {
  return [
    'You are a clinical assistant. From the DE-IDENTIFIED case below, return STRICT JSON only',
    '(no markdown) with exactly these keys:',
    '"summary" (a concise 2-3 sentence clinical summary),',
    '"interactionAlerts" (array of drug-interaction warning strings, may be empty),',
    '"allergyAlerts" (array of allergy warning strings, may be empty).',
    '',
    `Diagnosis: ${ctx.diagnosis ?? 'not specified'}`,
    `Symptoms: ${ctx.symptoms.join(', ') || 'none recorded'}`,
    `Medications: ${ctx.medications.join(', ') || 'none'}`,
    `Known allergies: ${ctx.allergies.join(', ') || 'none'}`,
    `Chronic conditions: ${ctx.chronic.join(', ') || 'none'}`,
    `Clinical note: ${ctx.content}`,
  ].join('\n')
}

interface GeminiJson {
  summary?: unknown
  interactionAlerts?: unknown
  allergyAlerts?: unknown
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string') : []
}

async function callGemini(ctx: SummaryContext): Promise<SummaryResult> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${env.GEMINI_API_KEY}`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: buildPrompt(ctx) }] }],
      generationConfig: { responseMimeType: 'application/json', temperature: 0.2 },
    }),
  })

  if (!res.ok) {
    throw new Error(`Gemini API error: ${res.status}`)
  }

  const payload = (await res.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>
  }
  const text = payload.candidates?.[0]?.content?.parts?.[0]?.text
  if (!text) throw new Error('Gemini returned no content')

  const parsed = JSON.parse(text) as GeminiJson
  return {
    summary: typeof parsed.summary === 'string' ? parsed.summary : 'No summary produced.',
    interactionAlerts: asStringArray(parsed.interactionAlerts),
    allergyAlerts: asStringArray(parsed.allergyAlerts),
    model: GEMINI_MODEL,
  }
}

export async function generateSummary(ctx: SummaryContext): Promise<SummaryResult> {
  if (!env.GEMINI_API_KEY) {
    return buildDemoSummary(ctx)
  }
  try {
    return await callGemini(ctx)
  } catch (err) {
    // Never fail the request over the AI call — fall back to the rule-based summary.
    logger.error({ err }, 'Gemini summary failed; using rule-based fallback')
    return { ...buildDemoSummary(ctx), model: 'demo-fallback' }
  }
}
