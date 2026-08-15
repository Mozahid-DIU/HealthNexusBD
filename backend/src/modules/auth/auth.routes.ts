import { Router } from 'express'
import { validate } from '../../middleware/validate.ts'
import { authenticate } from '../../middleware/auth.ts'
import { authLimiter } from '../../middleware/rateLimit.ts'
import {
  forgotPasswordSchema,
  loginSchema,
  refreshSchema,
  registerSchema,
  resetPasswordSchema,
} from './auth.schema.ts'
import {
  forgotPasswordController,
  loginController,
  logoutController,
  meController,
  refreshController,
  registerController,
  resetPasswordController,
} from './auth.controller.ts'

export const authRouter = Router()

authRouter.post('/register', authLimiter, validate(registerSchema), registerController)
authRouter.post('/login', authLimiter, validate(loginSchema), loginController)
authRouter.post('/refresh', authLimiter, validate(refreshSchema), refreshController)
authRouter.post('/logout', authenticate, logoutController)
authRouter.get('/me', authenticate, meController)

authRouter.post(
  '/forgot-password',
  authLimiter,
  validate(forgotPasswordSchema),
  forgotPasswordController,
)
authRouter.post(
  '/reset-password',
  authLimiter,
  validate(resetPasswordSchema),
  resetPasswordController,
)
