import { env } from '../config/env.ts'
import { logger } from '../utils/logger.ts'
import { resolveSideEffects, type SideEffect } from './sideEffects.ts'

/**
 * Clinical AI: a per-visit summary (with medicine side effects) and a whole-history
 * overview for the doctor.
 *
 * Two modes, chosen by whether GEMINI_API_KEY is set:
 *   - real: calls Google Gemini with a DE-IDENTIFIED case (no name/UHID/NID/phone).
 *   - demo: deterministic rule-based output, so every feature works with no key and as
 *     a safe fallback if the API call fails.
 *
 * Input is de-identified by the caller — only clinical fields reach this service.
 * Output is advisory only; the doctor makes every decision.
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
  sideEffects: SideEffect[]
  model: string
}

/** A patient's history, de-identified: no name, IDs, contact details or free-text notes. */
export interface OverviewContext {
  age: number | null
  gender: string | null
  allergies: string[]
  chronic: string[]
  totalVisits: number
  /** Everything prescribed in the last 90 days: what the patient may be taking now. */
  currentMedications: string[]
  /** Newest first; `month` is YYYY-MM. */
  visits: Array<{ month: string; diagnosis: string | null; symptoms: string[]; medications: string[] }>
  labTests: Array<{ month: string; test: string }>
}

export interface OverviewResult {
  summary: string
  alerts: string[]
  model: string
}

/**
 * Tried in order until one answers. "…-latest" aliases track Google's current models, so
 * they don't 404 as versions retire. Flash-Lite comes first: on the free tier it answers in
 * about 1.5 s with good Bangla, while Flash is often overloaded (503) or slow.
 */
export const GEMINI_MODELS = ['gemini-flash-lite-latest', 'gemini-flash-latest'] as const
/** A doctor is waiting on this: give up on a model after this long and try the next. */
const GEMINI_TIMEOUT_MS = 12_000

// --- Small rule base for the demo mode (and as an always-on safety net) ---

const PENICILLIN_FAMILY = ['penicillin', 'amoxicillin', 'ampicillin', 'flucloxacillin', 'co-amoxiclav']

/** `class` rules fire for any one drug of the class; the others need every listed drug (a pair). */
const INTERACTION_RULES: Array<{ drugs: string[]; class?: true; alert: string }> = [
  { drugs: ['metformin'], alert: 'Metformin: monitor renal function; withhold before iodinated-contrast studies.' },
  { drugs: ['losartan', 'ramipril', 'enalapril'], class: true, alert: 'ACE inhibitor / ARB: monitor serum potassium and renal function.' },
  { drugs: ['amlodipine', 'simvastatin'], alert: 'Amlodipine + Simvastatin: limit simvastatin to 20 mg/day (interaction).' },
  { drugs: ['aspirin', 'warfarin'], alert: 'Aspirin + Warfarin: increased bleeding risk — review necessity.' },
  { drugs: ['atorvastatin'], alert: 'Statin: check LFTs at baseline; counsel on muscle symptoms.' },
]

/** A penicillin-family medicine prescribed despite a documented penicillin allergy. */
function allergyClashes(allergies: string[], meds: string[]): string[] {
  if (!allergies.some((a) => a.toLowerCase().includes('penicillin'))) return []
  const clash = meds.find((m) => PENICILLIN_FAMILY.some((p) => m.toLowerCase().includes(p)))
  return clash ? [`⚠ ${clash} may cross-react with a documented Penicillin allergy.`] : []
}

function interactionAlerts(meds: string[]): string[] {
  const medsLower = meds.map((m) => m.toLowerCase())
  const alerts: string[] = []
  for (const rule of INTERACTION_RULES) {
    const matched = rule.drugs.filter((d) => medsLower.some((m) => m.includes(d)))
    const needed = rule.class || rule.drugs.length === 1 ? 1 : rule.drugs.length
    if (matched.length >= needed) {
      alerts.push(rule.alert)
    }
  }
  return alerts
}

function buildDemoSummary(ctx: SummaryContext): SummaryResult {
  const meds = ctx.medications.filter(Boolean)

  const parts: string[] = []
  parts.push(`Working diagnosis: ${ctx.diagnosis ?? 'not specified'}.`)
  if (ctx.chronic.length) parts.push(`Background: ${ctx.chronic.join(', ')}.`)
  if (ctx.symptoms.length) parts.push(`Presenting with ${ctx.symptoms.join(', ')}.`)
  parts.push(meds.length ? `Current management: ${meds.join(', ')}.` : 'No active medications recorded.')

  // Allergy alerts: list documented allergies + flag likely drug cross-reactions.
  const allergyAlerts = [
    ...ctx.allergies.map((a) => `Documented allergy: ${a} — avoid ${a} and cross-reactive agents.`),
    ...allergyClashes(ctx.allergies, meds),
  ]

  return {
    summary: parts.join(' '),
    interactionAlerts: interactionAlerts(meds),
    allergyAlerts,
    sideEffects: resolveSideEffects(meds),
    model: 'demo-rule-based',
  }
}

const unique = (items: string[]) => [...new Set(items)]

function buildDemoOverview(ctx: OverviewContext): OverviewResult {
  const parts: string[] = []
  if (ctx.age !== null || ctx.gender) {
    parts.push(`${[ctx.age !== null ? `${ctx.age}-year-old` : null, ctx.gender ?? 'patient'].filter(Boolean).join(' ')}.`)
  }
  parts.push(ctx.allergies.length ? `Known allergies: ${ctx.allergies.join(', ')}.` : 'No known allergies.')
  if (ctx.chronic.length) parts.push(`Chronic conditions: ${ctx.chronic.join(', ')}.`)

  const latest = ctx.visits[0]
  if (!latest) {
    parts.push('No visits recorded yet.')
    return { summary: parts.join(' '), alerts: [], model: 'demo-rule-based' }
  }

  parts.push(
    `${ctx.totalVisits} visit${ctx.totalVisits === 1 ? '' : 's'} on record; most recent (${latest.month}): ${latest.diagnosis ?? 'no diagnosis noted'}.`,
  )
  const earlier = [...new Set(ctx.visits.slice(1).map((v) => v.diagnosis).filter((d): d is string => Boolean(d)))].slice(0, 3)
  if (earlier.length) parts.push(`Earlier problems: ${earlier.join(', ')}.`)
  const meds = ctx.currentMedications
  if (meds.length) parts.push(`Medicines prescribed in the last 90 days: ${meds.join(', ')}.`)
  if (ctx.labTests.length) {
    parts.push(`Recent lab tests: ${ctx.labTests.slice(0, 4).map((l) => `${l.test} (${l.month})`).join(', ')}.`)
  }

  return {
    summary: parts.join(' '),
    alerts: [...allergyClashes(ctx.allergies, meds), ...interactionAlerts(meds)],
    model: 'demo-rule-based',
  }
}

// --- Gemini ---

const escapeRegExp = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/**
 * Strip identifiers a doctor may have typed into a free-text note before it leaves the
 * server: the patient's own name, UHIDs, emails, phone numbers and NID-length digit runs.
 */
export function deidentifyNote(text: string, names: string[] = []): string {
  let out = text
    .replace(/BD-\d{4}-\d{5}/gi, '[id]')
    .replace(/[\w.+-]+@[\w-]+(?:\.[\w-]+)+/g, '[email]')
    .replace(/(?:\+?88)?01\d{9}/g, '[phone]')
    .replace(/\b\d{10,17}\b/g, '[id]')
  for (const part of names.flatMap((n) => n.split(/\s+/)).filter((p) => p.length >= 3)) {
    out = out.replace(new RegExp(`\\b${escapeRegExp(part)}\\b`, 'gi'), '[patient]')
  }
  return out
}

function buildSummaryPrompt(ctx: SummaryContext): string {
  return [
    'You are a clinical assistant. From the DE-IDENTIFIED case below, return STRICT JSON only',
    '(no markdown) with exactly these keys:',
    '"summary" (a concise 2-3 sentence clinical summary),',
    '"interactionAlerts" (array of drug-interaction warning strings, may be empty),',
    '"allergyAlerts" (array of allergy warning strings, may be empty),',
    '"sideEffects" (one entry per medication, for the PATIENT to read: {"drug": the medication name as given,',
    '"en": {"common": [...], "serious": [...], "advice": "..."}, "bn": the same keys written in simple Bangla}.',
    '"common" = frequent, usually mild effects; "serious" = signs that need a doctor straight away;',
    '"advice" = one short practical tip. At most 4 short items per list. Never suggest changing the dose).',
    '',
    `Diagnosis: ${ctx.diagnosis ?? 'not specified'}`,
    `Symptoms: ${ctx.symptoms.join(', ') || 'none recorded'}`,
    `Medications: ${ctx.medications.join(', ') || 'none'}`,
    `Known allergies: ${ctx.allergies.join(', ') || 'none'}`,
    `Chronic conditions: ${ctx.chronic.join(', ') || 'none'}`,
    // The caller already removed the patient's name; this catches any ID pattern left.
    `Clinical note: ${deidentifyNote(ctx.content)}`,
  ].join('\n')
}

function buildOverviewPrompt(ctx: OverviewContext): string {
  const visits = ctx.visits.map(
    (v) =>
      `- ${v.month}: ${v.diagnosis ?? 'no diagnosis'}` +
      `${v.symptoms.length ? `; symptoms: ${v.symptoms.join(', ')}` : ''}` +
      `${v.medications.length ? `; medicines: ${v.medications.join(', ')}` : ''}`,
  )
  return [
    'You are a clinical assistant briefing a doctor before a consultation. From the DE-IDENTIFIED',
    'patient history below, return STRICT JSON only (no markdown) with exactly these keys:',
    '"summary" (3-4 sentences: chronic conditions, allergies, the pattern of recent problems, current',
    'medicines, and anything the doctor should watch for),',
    '"alerts" (array of short safety warnings: allergy conflicts with current medicines, drug interactions,',
    'worrying patterns; may be empty). Do not diagnose or prescribe.',
    '',
    `Age: ${ctx.age ?? 'unknown'}; sex: ${ctx.gender ?? 'unknown'}`,
    `Known allergies: ${ctx.allergies.join(', ') || 'none'}`,
    `Chronic conditions: ${ctx.chronic.join(', ') || 'none'}`,
    `Medicines prescribed in the last 90 days: ${ctx.currentMedications.join(', ') || 'none'}`,
    `Visits (${ctx.totalVisits} in total, newest first):`,
    ...(visits.length ? visits : ['- none']),
    `Recent lab tests: ${ctx.labTests.map((l) => `${l.test} (${l.month})`).join(', ') || 'none'}`,
  ].join('\n')
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string') : []
}

interface GeminiAnswer {
  answer: Record<string, unknown>
  model: string
}

/**
 * Ask Gemini for a JSON object, trying each model in turn (busy, retired, slow or
 * malformed answers move on to the next). Throws the last failure so callers can fall back.
 */
async function askGemini(prompt: string): Promise<GeminiAnswer> {
  let lastError: unknown = new Error('Gemini: no model tried')
  for (const model of GEMINI_MODELS) {
    try {
      return { answer: await askModel(model, prompt), model }
    } catch (err) {
      lastError = err
      logger.warn({ model, reason: failureReason(err) }, 'Gemini model failed; trying the next')
    }
  }
  throw lastError
}

async function askModel(model: string, prompt: string): Promise<Record<string, unknown>> {
  // The key travels in a header, never the URL, so it can't end up in proxy or access logs.
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': env.GEMINI_API_KEY },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: 'application/json', temperature: 0.2 },
    }),
    signal: AbortSignal.timeout(GEMINI_TIMEOUT_MS),
  })
  if (!res.ok) throw new Error(`Gemini API error: ${res.status}`)

  const payload = (await res.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>
  }
  const text = payload.candidates?.[0]?.content?.parts?.[0]?.text
  if (!text) throw new Error('Gemini returned no content')

  const parsed: unknown = JSON.parse(text)
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('Gemini returned no object')
  return parsed as Record<string, unknown>
}

/**
 * Why a Gemini call failed, without its text: a JSON parse error quotes the model's
 * answer, which is clinical content and must not reach the logs.
 */
function failureReason(err: unknown): string {
  if (err instanceof SyntaxError) return 'invalid JSON from Gemini'
  if (err instanceof Error && err.name === 'TimeoutError') return `Gemini timed out after ${GEMINI_TIMEOUT_MS} ms`
  return err instanceof Error && err.message.startsWith('Gemini') ? err.message : 'request failed'
}

export async function generateSummary(ctx: SummaryContext): Promise<SummaryResult> {
  if (!env.GEMINI_API_KEY) return buildDemoSummary(ctx)
  try {
    const { answer, model } = await askGemini(buildSummaryPrompt(ctx))
    if (typeof answer.summary !== 'string' || answer.summary.trim() === '') throw new Error('Gemini gave no summary')
    // The rule-based checks always run too: they are cheap and must never be missed.
    const rules = buildDemoSummary(ctx)
    return {
      summary: answer.summary,
      interactionAlerts: unique([...rules.interactionAlerts, ...asStringArray(answer.interactionAlerts)]),
      allergyAlerts: unique([...rules.allergyAlerts, ...asStringArray(answer.allergyAlerts)]),
      sideEffects: resolveSideEffects(ctx.medications.filter(Boolean), answer.sideEffects),
      model,
    }
  } catch (err) {
    // Never fail the request over the AI call — fall back to the rule-based summary.
    logger.error({ reason: failureReason(err) }, 'Gemini summary failed; using rule-based fallback')
    return { ...buildDemoSummary(ctx), model: 'demo-fallback' }
  }
}

export async function generateOverview(ctx: OverviewContext): Promise<OverviewResult> {
  // Nothing to summarise: answer without spending an AI call.
  if (!env.GEMINI_API_KEY || ctx.visits.length === 0) return buildDemoOverview(ctx)
  try {
    const { answer, model } = await askGemini(buildOverviewPrompt(ctx))
    if (typeof answer.summary !== 'string' || answer.summary.trim() === '') throw new Error('Gemini gave no summary')
    // The rule-based checks always run too: they are cheap and must never be missed.
    const alerts = unique([...buildDemoOverview(ctx).alerts, ...asStringArray(answer.alerts)])
    return { summary: answer.summary, alerts, model }
  } catch (err) {
    logger.error({ reason: failureReason(err) }, 'Gemini overview failed; using rule-based fallback')
    return { ...buildDemoOverview(ctx), model: 'demo-fallback' }
  }
}
