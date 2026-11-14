import { z } from 'zod'

/** Turns kept per request: enough for a real conversation, bounded for the prompt. */
export const MAX_TURNS = 16
/** What the patient may type in one message. */
export const MAX_TURN_CHARS = 2000
/** The longest answer the assistant returns (and so may come back as history). */
export const MAX_REPLY_CHARS = 4000
const MAX_TOTAL_CHARS = 16_000

const turnSchema = z
  .object({
    role: z.enum(['user', 'model']),
    text: z.string().trim().min(1, 'Message is empty').max(MAX_REPLY_CHARS, 'Message is too long'),
    /** The server's signature on one of its own answers (see assistant.signing.ts). */
    sig: z.string().max(64).optional(),
  })
  .refine((t) => t.role === 'model' || t.text.length <= MAX_TURN_CHARS, { message: 'Message is too long', path: ['text'] })

/**
 * One chat request. The conversation lives in the patient's browser and is sent with
 * each message, so nothing they type is stored on the server.
 */
export const chatSchema = z
  .object({
    /** The patient agreed that their questions (and any attached record) go to the AI. */
    consent: z.literal(true, { errorMap: () => ({ message: 'Agree to the assistant terms first' }) }),
    lang: z.enum(['en', 'bn']).default('en'),
    messages: z.array(turnSchema).min(1).max(MAX_TURNS),
    /** One of the patient's own records or lab reports to explain. */
    attachment: z
      .object({ kind: z.enum(['record', 'labReport']), id: z.string().uuid('Invalid id') })
      .optional(),
  })
  .refine((v) => v.messages[v.messages.length - 1]?.role === 'user', {
    message: 'The last message must be the patient’s',
    path: ['messages'],
  })
  .refine((v) => v.messages.reduce((n, m) => n + m.text.length, 0) <= MAX_TOTAL_CHARS, {
    message: 'The conversation is too long; start a new chat',
    path: ['messages'],
  })

export type ChatInput = z.infer<typeof chatSchema>
