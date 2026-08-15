# HealthNexus BD — Environment Variables

> Every config value the backend needs. Copy `.env.example` → `.env` and fill real values.
> `.env` is git-ignored and never committed. `config/env.ts` validates these at startup.

## Reference

| Variable | Purpose | Example / how to get |
|----------|---------|----------------------|
| `NODE_ENV` | Environment | `development` / `production` |
| `PORT` | API port | `4000` |
| `DATABASE_URL` | PostgreSQL connection | Neon/Supabase dashboard → connection string (pooled) |
| `JWT_ACCESS_SECRET` | Sign access tokens | 32+ random chars (`openssl rand -hex 32`) |
| `JWT_REFRESH_SECRET` | Sign refresh tokens | different 32+ random chars |
| `ACCESS_TOKEN_TTL` | Access token lifetime | `15m` |
| `REFRESH_TOKEN_TTL` | Refresh token lifetime | `7d` |
| `AES_SECRET_KEY` | AES-256 record/file encryption key | 64 hex chars — `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `GEMINI_API_KEY` | AI clinical summaries | ai.google.dev → Get API key |
| `OTP_MODE` | `real` or `demo` (defense fallback) | `real` normally; `demo` prints OTP instead of sending |
| `OTP_TTL_MINUTES` | OTP validity window | `5` |
| `OTP_MAX_ATTEMPTS` | Wrong-OTP lockout | `5` |
| `SMS_API_KEY` | BulkSMSBD API key | bulksmsbd.net dashboard |
| `SMS_SENDER_ID` | BulkSMSBD sender ID | from BulkSMSBD (non-masking ok for capstone) |
| `SMS_API_URL` | BulkSMSBD endpoint | `http://bulksmsbd.net/api/smsapi` |
| `EMAIL_USER` | Gmail address (forgot-password OTP) | project gmail |
| `EMAIL_APP_PASSWORD` | Gmail App Password | myaccount.google.com/apppasswords (needs 2FA on) |
| `EMAIL_FROM` | From name/address | `HealthNexus BD <no-reply@...>` |
| `SESSION_TTL_MINUTES` | Consent session lifetime | `30` |
| `CORS_ORIGIN` | Allowed frontend origin | `http://localhost:5173` |
| `UPLOAD_DIR` | Where lab PDFs are stored (dev) | `./uploads` |
| `MAX_UPLOAD_MB` | Upload size cap | `10` |

## Frontend (`frontend/.env`)

| Variable | Purpose | Example |
|----------|---------|---------|
| `VITE_API_URL` | Backend base URL | `http://localhost:4000/api` |

> Anything in a Vite `VITE_*` var is exposed to the browser — never put secrets there.
> Keys (Gemini, SMS, JWT, AES) live **only** in the backend `.env`.
