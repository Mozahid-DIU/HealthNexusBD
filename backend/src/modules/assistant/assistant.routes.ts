import { Router, type Request } from 'express'
import rateLimit from 'express-rate-limit'
import { authenticate } from '../../middleware/auth.ts'
import { requireRole } from '../../middleware/rbac.ts'
import { validate } from '../../middleware/validate.ts'
import { skipInTests } from '../../middleware/rateLimit.ts'
import { sendError, sendSuccess } from '../../utils/apiResponse.ts'
import { chatSchema } from './assistant.schema.ts'
import { chatController } from './assistant.controller.ts'
import { looksLikeEmergency } from './assistant.safety.ts'
import { emergencyReply } from './assistant.service.ts'

/** The latest message, read defensively: the limiter runs before validation. */
function lastMessage(req: Request): string {
  const messages = (req.body as { messages?: unknown })?.messages
  const last = Array.isArray(messages) ? (messages[messages.length - 1] as { text?: unknown } | undefined) : undefined
  return typeof last?.text === 'string' ? last.text : ''
}

/**
 * Each patient gets a personal budget on the shared AI quota (keyed by account, not IP: a
 * family may share one connection). Over the limit, an emergency is still answered.
 */
export const assistantLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipInTests,
  keyGenerator: (req) => `assistant:${req.user?.id ?? 'anonymous'}`,
  handler: (req, res) => {
    if (req.user && looksLikeEmergency(lastMessage(req))) {
      const lang = (req.body as { lang?: unknown })?.lang === 'bn' ? 'bn' : 'en'
      return sendSuccess(res, emergencyReply(req.user.id, lang))
    }
    return sendError(res, 'You have sent a lot of messages. Please wait a few minutes before asking again.', 429)
  },
})

/** The patient Health Assistant: patients only, on their own data, with a personal rate limit. */
export const assistantRouter = Router()

assistantRouter.post('/chat', authenticate, requireRole('patient'), assistantLimiter, validate(chatSchema), chatController)
