import { env } from '../config/env.ts'
import { logger } from '../utils/logger.ts'

/**
 * The one way the backend talks to Google Gemini. Every caller gets the same safety:
 * the key travels in a header (never the URL), each model has a time limit, a busy or
 * retired model moves on to the next, and logs never carry the model's text.
 */

/**
 * Tried in order until one answers. "…-latest" aliases track Google's current models, so
 * they don't 404 as versions retire. Flash-Lite comes first: on the free tier it answers in
 * about 1.5 s with good Bangla, while Flash is often overloaded (503) or slow.
 */
export const GEMINI_MODELS = ['gemini-flash-lite-latest', 'gemini-flash-latest'] as const
/** Someone is waiting on this: give up on a model after this long and try the next. */
export const GEMINI_TIMEOUT_MS = 12_000

export interface GeminiTurn {
  role: 'user' | 'model'
  text: string
}

export interface GeminiRequest {
  /** One prompt, or a whole conversation (oldest first, ending with the user). */
  contents: string | GeminiTurn[]
  /** Standing instructions the model must follow (safety rules, language). */
  system?: string
  /** Ask for a JSON object instead of prose. */
  json?: boolean
  temperature?: number
}

export interface GeminiResult {
  text: string
  model: string
}

export const isGeminiConfigured = (): boolean => Boolean(env.GEMINI_API_KEY)

/**
 * Why a call failed, without its content: a JSON parse error quotes the model's answer,
 * which is clinical text and must never reach the logs.
 */
export function failureReason(err: unknown): string {
  if (err instanceof SyntaxError) return 'invalid JSON from Gemini'
  if (err instanceof Error && err.name === 'GeminiBlockedError') return 'Gemini blocked the request on safety grounds'
  if (err instanceof Error && err.name === 'TimeoutError') return `Gemini timed out after ${GEMINI_TIMEOUT_MS} ms`
  return err instanceof Error && err.message.startsWith('Gemini') ? err.message : 'request failed'
}

function toContents(contents: GeminiRequest['contents']) {
  const turns: GeminiTurn[] = typeof contents === 'string' ? [{ role: 'user', text: contents }] : contents
  return turns.map((t) => ({ role: t.role, parts: [{ text: t.text }] }))
}

async function askModel(model: string, request: GeminiRequest): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': env.GEMINI_API_KEY },
    body: JSON.stringify({
      ...(request.system ? { systemInstruction: { parts: [{ text: request.system }] } } : {}),
      contents: toContents(request.contents),
      generationConfig: {
        temperature: request.temperature ?? 0.2,
        ...(request.json ? { responseMimeType: 'application/json' } : {}),
      },
    }),
    signal: AbortSignal.timeout(GEMINI_TIMEOUT_MS),
  })
  if (!res.ok) throw new Error(`Gemini API error: ${res.status}`)

  const payload = (await res.json()) as {
    promptFeedback?: { blockReason?: string }
    candidates?: Array<{ finishReason?: string; content?: { parts?: Array<{ text?: string }> } }>
  }
  const finish = payload.candidates?.[0]?.finishReason
  if (payload.promptFeedback?.blockReason || (finish && BLOCKED_FINISH.has(finish))) throw new GeminiBlockedError()
  const text = payload.candidates?.[0]?.content?.parts?.map((p) => p.text ?? '').join('').trim()
  if (!text) throw new Error('Gemini returned no content')
  return text
}

const BLOCKED_FINISH = new Set(['SAFETY', 'PROHIBITED_CONTENT', 'BLOCKLIST', 'SPII'])

/** Google's own safety filter refused: every model would refuse the same, so don't retry. */
export class GeminiBlockedError extends Error {
  constructor() {
    super('Gemini blocked the request on safety grounds')
    this.name = 'GeminiBlockedError'
  }
}

/** Text from the first model that answers; throws the last failure if none does. */
export async function geminiGenerate(request: GeminiRequest): Promise<GeminiResult> {
  let lastError: unknown = new Error('Gemini: no model tried')
  for (const model of GEMINI_MODELS) {
    try {
      return { text: await askModel(model, request), model }
    } catch (err) {
      if (err instanceof GeminiBlockedError) throw err
      lastError = err
      logger.warn({ model, reason: failureReason(err) }, 'Gemini model failed; trying the next')
    }
  }
  throw lastError
}

/** Like geminiGenerate, but parses a JSON object (a malformed answer moves on too). */
export async function geminiJson(request: Omit<GeminiRequest, 'json'>): Promise<{ answer: Record<string, unknown>; model: string }> {
  let lastError: unknown = new Error('Gemini: no model tried')
  for (const model of GEMINI_MODELS) {
    try {
      const parsed: unknown = JSON.parse(await askModel(model, { ...request, json: true }))
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('Gemini returned no object')
      return { answer: parsed as Record<string, unknown>, model }
    } catch (err) {
      lastError = err
      logger.warn({ model, reason: failureReason(err) }, 'Gemini model failed; trying the next')
    }
  }
  throw lastError
}
