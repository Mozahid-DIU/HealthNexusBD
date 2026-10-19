import { TEST_DATABASE_URL } from './test-env.ts'

/**
 * Runs before each test file, before the app is imported. Every value is set
 * explicitly because `dotenv` never overrides an existing variable — so nothing from
 * the real backend/.env (Neon URL, Cloudinary/SMS/email/Gemini keys) can leak in.
 */
Object.assign(process.env, {
  NODE_ENV: 'test',
  LOG_LEVEL: 'silent',
  DATABASE_URL: TEST_DATABASE_URL,
  JWT_ACCESS_SECRET: 'test-access-secret-0123456789abcdef',
  JWT_REFRESH_SECRET: 'test-refresh-secret-0123456789abcdef',
  AES_SECRET_KEY: 'a1'.repeat(32),
  OTP_MODE: 'demo',
  GEMINI_API_KEY: '',
  SMS_API_KEY: '',
  EMAIL_USER: '',
  EMAIL_APP_PASSWORD: '',
  CLOUDINARY_CLOUD_NAME: '',
  CLOUDINARY_API_KEY: '',
  CLOUDINARY_API_SECRET: '',
})
