import { logger } from '../utils/logger.ts'
import { failureReason, geminiJson, isGeminiConfigured } from './gemini.ts'
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

export { GEMINI_MODELS } from './gemini.ts'

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

const BANGLA_DIGITS = '০১২৩৪৫৬৭৮৯'
const toAsciiDigits = (text: string) => text.replace(/[০-৯]/g, (d) => String(BANGLA_DIGITS.indexOf(d)))

/**
 * A line that exists only to identify the person: the "Name / Mobile / Address / Ref. by /
 * ID" header of a lab report (in English or Bangla). Such lines are dropped whole, which also
 * catches names spelled differently from the account (Md./Mohammad, Bangla script).
 */
const IDENTITY_LINE =
  /^[^\S\n]*(?:patient(?:'s)?[^\S\n]*name|name|mobile|phone|cell|contact(?:[^\S\n]*no\.?)?|address|addr\.?|ref(?:\.|erred)?[^\S\n]*by|referred[^\S\n]*by|consultant|uhid|nid|patient[^\S\n]*id|reg(?:istration)?\.?[^\S\n]*(?:no|id)\.?|e-?mail|d\.?o\.?b\.?|date[^\S\n]*of[^\S\n]*birth|রোগীর[^\S\n]*নাম|নাম|মোবাইল|ফোন|ঠিকানা|জন্ম[^\S\n]*তারিখ)[^\S\n]*[:：\-–].*$/gim

/** Letters, marks and digits of any script: a name only matches as a whole word. */
const WORD_EDGE = '[\\p{L}\\p{M}\\p{N}]'

/**
 * Strip identifiers before text leaves the server (free text, report PDFs, chat messages):
 * identity header lines, the patient's own name in any script, UHIDs, emails, phone numbers
 * and NID-length digit runs, also when written with Bangla digits, spaces or dashes.
 */
export function deidentifyNote(text: string, names: string[] = []): string {
  let out = toAsciiDigits(text.normalize('NFC'))
    .replace(IDENTITY_LINE, '[identity line removed]')
    .replace(/BD-\d{4}-\d{5}/gi, '[id]')
    .replace(/[\w.+-]+@[\w-]+(?:\.[\w-]+)+/g, '[email]')
    // Bangladeshi mobiles: 01X-XXXXXXXX, with or without +88, spaces or dashes.
    .replace(/(?:\+?88[\s-]?)?0?[\s-]?1[3-9](?:[\s-]?\d){8}(?!\d)/g, '[phone]')
    // NID and other long ID numbers (10–17 digits), spaces or dashes allowed between.
    .replace(/(?<!\d)\d(?:[\s-]?\d){9,16}(?!\d)/g, '[id]')
  // Name parts of at least 3 letters (any script); "Md." and initials are too common to match.
  const parts = names.flatMap((n) => n.normalize('NFC').split(/\s+/)).filter((p) => (p.match(/[\p{L}\p{N}]/gu) ?? []).length >= 3)
  for (const part of parts) {
    out = out.replace(new RegExp(`(?<!${WORD_EDGE})${escapeRegExp(part)}(?!${WORD_EDGE})`, 'giu'), '[patient]')
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

export async function generateSummary(ctx: SummaryContext): Promise<SummaryResult> {
  if (!isGeminiConfigured()) return buildDemoSummary(ctx)
  try {
    const { answer, model } = await geminiJson({ contents: buildSummaryPrompt(ctx) })
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
  if (!isGeminiConfigured() || ctx.visits.length === 0) return buildDemoOverview(ctx)
  try {
    const { answer, model } = await geminiJson({ contents: buildOverviewPrompt(ctx) })
    if (typeof answer.summary !== 'string' || answer.summary.trim() === '') throw new Error('Gemini gave no summary')
    // The rule-based checks always run too: they are cheap and must never be missed.
    const alerts = unique([...buildDemoOverview(ctx).alerts, ...asStringArray(answer.alerts)])
    return { summary: answer.summary, alerts, model }
  } catch (err) {
    logger.error({ reason: failureReason(err) }, 'Gemini overview failed; using rule-based fallback')
    return { ...buildDemoOverview(ctx), model: 'demo-fallback' }
  }
}
