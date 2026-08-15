import 'dotenv/config'
import { z } from 'zod'

/**
 * Validate and type all environment variables at startup.
 * Fail fast with a clear message if anything required is missing or malformed.
 */
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),

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

  OTP_MODE: z.enum(['real', 'demo']).default('demo'),
  OTP_TTL_MINUTES: z.coerce.number().int().positive().default(5),
  OTP_MAX_ATTEMPTS: z.coerce.number().int().positive().default(5),
  SESSION_TTL_MINUTES: z.coerce.number().int().positive().default(30),

  // External services — optional until their step; validated when used.
  GEMINI_API_KEY: z.string().optional().default(''),
  SMS_API_KEY: z.string().optional().default(''),
  SMS_SENDER_ID: z.string().optional().default(''),
  SMS_API_URL: z.string().optional().default('http://bulksmsbd.net/api/smsapi'),
  EMAIL_USER: z.string().optional().default(''),
  EMAIL_APP_PASSWORD: z.string().optional().default(''),
  EMAIL_FROM: z.string().optional().default('HealthNexus BD <no-reply@healthnexus.bd>'),
  CLOUDINARY_CLOUD_NAME: z.string().optional().default(''),
  CLOUDINARY_API_KEY: z.string().optional().default(''),
  CLOUDINARY_API_SECRET: z.string().optional().default(''),

  UPLOAD_DIR: z.string().default('./uploads'),
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

export const env = parsed.data
export const isDev = env.NODE_ENV === 'development'
export const isProd = env.NODE_ENV === 'production'
