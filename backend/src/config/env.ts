import 'dotenv/config'
import { z } from 'zod'

/**
 * Validate and type all environment variables at startup.
 * Fail fast with a clear message if anything required is missing or malformed.
 */
export const envSchema = z.object({
  // Unset means production: every dev-only shortcut (codes on screen) stays off unless
  // the environment says otherwise. Local .env and the tests set it explicitly.
  NODE_ENV: z.enum(['development', 'production', 'test']).default('production'),
  PORT: z.coerce.number().int().positive().default(4000),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  // Proxies in front of the API (Render: 1). Lets req.ip be the visitor's address, so
  // rate limits apply per visitor instead of to everyone behind the proxy at once.
  // Unset: 1 on Render (which sets RENDER), else 0.
  TRUST_PROXY: z.coerce.number().int().min(0).max(5).optional(),

  DATABASE_URL: z
    .string()
    .min(1, 'DATABASE_URL is required — paste your Neon connection string into backend/.env')
    .refine(
      (v) => v.startsWith('postgresql://') || v.startsWith('postgres://'),
      'DATABASE_URL must be a valid postgresql:// connection string (paste your Neon pooled URL)',
    ),

  JWT_ACCESS_SECRET: z.string().min(16, 'JWT_ACCESS_SECRET must be set'),
  JWT_REFRESH_SECRET: z.string().min(16, 'JWT_REFRESH_SECRET must be set'),
  ACCESS_TOKEN_TTL: z.string().default('15m'),
  REFRESH_TOKEN_TTL: z.string().default('7d'),

  AES_SECRET_KEY: z
    .string()
    .regex(/^[0-9a-fA-F]{64}$/, 'AES_SECRET_KEY must be 64 hex chars (32 bytes)'),

  // Unset → decided by NODE_ENV (see resolveOtpMode), so production fails closed.
  OTP_MODE: z.enum(['real', 'demo']).optional(),
  OTP_TTL_MINUTES: z.coerce.number().int().positive().default(5),
  OTP_MAX_ATTEMPTS: z.coerce.number().int().positive().default(5),
  SESSION_TTL_MINUTES: z.coerce.number().int().positive().default(30),

  // External services — optional until their step; validated when used.
  GEMINI_API_KEY: z.string().optional().default(''),
  // Optional: models to try in order, comma-separated (see services/gemini.ts).
  GEMINI_MODELS: z.string().optional(),
  SMS_API_KEY: z.string().optional().default(''),
  SMS_SENDER_ID: z.string().optional().default(''),
  SMS_API_URL: z.string().optional().default('https://bulksmsbd.net/api/smsapi'),
  // Most real SMS sent per Dhaka day (each costs money).
  SMS_DAILY_LIMIT: z.coerce.number().int().positive().default(50),
  EMAIL_USER: z.string().optional().default(''),
  EMAIL_APP_PASSWORD: z.string().optional().default(''),
  EMAIL_FROM: z.string().optional().default('HealthNexus BD <no-reply@healthnexus.bd>'),
  CLOUDINARY_CLOUD_NAME: z.string().optional().default(''),
  CLOUDINARY_API_KEY: z.string().optional().default(''),
  CLOUDINARY_API_SECRET: z.string().optional().default(''),

  UPLOAD_DIR: z.string().default('./uploads'),
  // Keep in step with MAX_REPORT_MB in frontend/src/lib/pdfFile.ts (client-side check + message).
  MAX_UPLOAD_MB: z.coerce.number().int().positive().default(10),
})

const parsed = envSchema.safeParse(process.env)

if (!parsed.success) {
  const issues = parsed.error.issues
    .map((i) => `  • ${i.path.join('.')}: ${i.message}`)
    .join('\n')
  // eslint-disable-next-line no-console
  console.error(`\n❌ Invalid environment configuration:\n${issues}\n`)
  process.exit(1)
}

type OtpMode = 'real' | 'demo'

/**
 * Demo mode shows the consent code to the requesting doctor, which would let them grant
 * themselves access. So an unset mode means real SMS in production; a hosted demo must
 * opt in explicitly with OTP_MODE=demo.
 */
export function resolveOtpMode(nodeEnv: string, raw: OtpMode | undefined): OtpMode {
  return raw ?? (nodeEnv === 'production' ? 'real' : 'demo')
}

export const env = {
  ...parsed.data,
  OTP_MODE: resolveOtpMode(parsed.data.NODE_ENV, parsed.data.OTP_MODE),
  TRUST_PROXY: parsed.data.TRUST_PROXY ?? (process.env.RENDER ? 1 : 0),
}
export const isDev = env.NODE_ENV === 'development'
export const isProd = env.NODE_ENV === 'production'
