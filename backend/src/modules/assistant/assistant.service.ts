import { AppError } from '../../utils/AppError.ts'
import { writeAudit } from '../../utils/audit.ts'
import { logger } from '../../utils/logger.ts'
import { deidentifyNote } from '../../services/ai.ts'
import {
  GeminiBlockedError,
  failureReason,
  geminiGenerate,
  isGeminiConfigured,
  type GeminiTurn,
} from '../../services/gemini.ts'
import { buildAttachment, patientFacts, profileContext, type Attachment } from './assistant.context.ts'
import {
  BLOCKED_REPLY,
  EMERGENCY_REPLY,
  looksLikeEmergency,
  mentionsMedicineChange,
  neutraliseDataTags,
  systemPrompt,
} from './assistant.safety.ts'
import { MAX_REPLY_CHARS, type ChatInput } from './assistant.schema.ts'
import { signTurn, verifyTurn } from './assistant.signing.ts'

export interface ChatReply {
  reply: string
  /** Signature to send back with this answer as history (see assistant.signing.ts). */
  sig: string
  /** The latest message may describe an emergency: the UI shows a 999 call-out first. */
  emergency: boolean
  /** The answer mentions doses or stopping a medicine: the UI adds an "ask your doctor" reminder. */
  medicineCaution: boolean
  /** `safety-rule` when the reply is built-in text rather than the AI's. */
  model: string
  attachment: { kind: Attachment['kind']; id: string; title: string } | null
}

type Shared = ChatReply['attachment']

function reply(userId: string, text: string, fields: Omit<ChatReply, 'reply' | 'sig' | 'medicineCaution'>): ChatReply {
  return { reply: text, sig: signTurn(userId, text), medicineCaution: mentionsMedicineChange(text), ...fields }
}

/** The built-in emergency answer: given whenever the AI can't answer an emergency. */
export function emergencyReply(userId: string, lang: ChatInput['lang'], attachment: Shared = null): ChatReply {
  return reply(userId, EMERGENCY_REPLY[lang], { emergency: true, model: 'safety-rule', attachment })
}

/**
 * The model's view of the conversation. The background and any attachment travel with the
 * latest question inside <patient_data>; untrusted text can't close that wrapper.
 */
function conversation(input: ChatInput, background: string, attachment: Attachment | null, names: string[]): GeminiTurn[] {
  const turns = input.messages.map((m) => ({ role: m.role, text: neutraliseDataTags(deidentifyNote(m.text, names)) }))
  const last = turns[turns.length - 1]!
  const data = neutraliseDataTags([background, attachment?.context].filter(Boolean).join('\n\n'))
  turns[turns.length - 1] = { role: 'user', text: `<patient_data>\n${data}\n</patient_data>\n\n${last.text}` }
  return turns
}

export async function chat(userId: string, input: ChatInput, ip?: string | null): Promise<ChatReply> {
  const question = input.messages[input.messages.length - 1]!.text
  // Decided first, so an emergency is answered whatever fails afterwards.
  const emergency = looksLikeEmergency(question)

  // Only answers this server gave may come back as the assistant's side of the conversation.
  const forged = input.messages.some((m) => m.role === 'model' && !verifyTurn(userId, m.text, m.sig))
  if (forged) {
    if (emergency) return emergencyReply(userId, input.lang)
    throw AppError.badRequest('This conversation could not be verified. Please start a new chat.')
  }

  let facts: Awaited<ReturnType<typeof patientFacts>>
  let attachment: Attachment | null
  try {
    facts = await patientFacts(userId)
    attachment = input.attachment ? await buildAttachment(facts, input.attachment) : null
  } catch (err) {
    if (emergency) return emergencyReply(userId, input.lang)
    throw err
  }
  const shared: Shared = attachment ? { kind: attachment.kind, id: attachment.id, title: attachment.title } : null

  if (!isGeminiConfigured()) {
    if (emergency) return emergencyReply(userId, input.lang)
    throw new AppError('The health assistant is not available right now.', 503, 'AI_UNAVAILABLE')
  }

  let answer: { text: string; model: string }
  try {
    answer = await geminiGenerate({
      system: systemPrompt(input.lang),
      contents: conversation(input, profileContext(facts), attachment, [facts.fullName]),
      temperature: 0.3,
    })
  } catch (err) {
    logger.error({ reason: failureReason(err) }, 'Health assistant could not get an answer from Gemini')
    // Google's own filter refused (often a crisis): still point to help, never "try again".
    if (err instanceof GeminiBlockedError) {
      return reply(userId, BLOCKED_REPLY[input.lang], { emergency, model: 'safety-rule', attachment: null })
    }
    if (emergency) return emergencyReply(userId, input.lang)
    throw new AppError('The health assistant is busy right now. Please try again in a minute.', 503, 'AI_UNAVAILABLE')
  }

  if (attachment) {
    // Logged once the AI has actually received it, so the patient's access log is exact.
    await writeAudit({
      actorUserId: userId,
      action: 'view',
      patientId: facts.patientId,
      resource: `ai_assistant:${attachment.kind === 'record' ? 'record' : 'lab_report'}:${attachment.id}`,
      ipAddress: ip ?? null,
    })
  }
  return reply(userId, answer.text.slice(0, MAX_REPLY_CHARS), { emergency, model: answer.model, attachment: shared })
}
