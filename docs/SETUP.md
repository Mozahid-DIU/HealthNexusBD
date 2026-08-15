# HealthNexus BD — Setup & Run

> How to get the project running from zero. Prerequisites, install, migrate, seed, run.

## Prerequisites

- **Node.js** ≥ 20 (you have v22 ✅)
- **npm** (you have ✅)
- A **PostgreSQL** database — Neon or Supabase (cloud, free). No local install needed.
- Accounts/keys ready (see [ENV.md](./ENV.md)):
  - PostgreSQL `DATABASE_URL`
  - Gemini API key
  - BulkSMSBD API key + Sender ID (+ small balance)
  - Gmail + App Password

## 1. Get a database (Neon example)

1. Sign up at neon.tech → create a project.
2. Copy the **pooled** connection string → this is `DATABASE_URL`.

## 2. Backend

```bash
cd backend
cp ../docs/.env.example .env      # then fill real values
npm install

# generate secrets
node -e "console.log('AES', require('crypto').randomBytes(32).toString('hex'))"
node -e "console.log('JWT', require('crypto').randomBytes(32).toString('hex'))"

# database
npx prisma generate
npx prisma migrate dev --name init   # creates all tables
npm run seed                          # loads demo data (see SEED.md)

# run
npm run dev                           # API on http://localhost:4000
```

Verify: open `http://localhost:4000/api/health` → should return a green status.

## 3. Frontend

```bash
cd frontend
echo "VITE_API_URL=http://localhost:4000/api" > .env
npm install
npm run dev                           # app on http://localhost:5173
```

## 4. Log in with demo accounts

See [SEED.md](./SEED.md). Shared demo password: `Demo@1234`.
- Patient: `rahim@...` (has records, allergies, an active consent session)
- Doctor: `ayesha.karim@hn.bd` (BMDC-verified)
- Lab: PathCare Diagnostics
- Admin: `admin@healthnexus.bd`

## 5. Demo the consent flow (real SMS)

1. Log in as **Doctor** → Find Patient → search `BD-2026-01234` → Request Access.
2. Patient's phone gets an **SMS OTP** (BulkSMSBD).
3. Enter the OTP on the doctor's screen → records open.
4. As **Patient**, open Audit Log → see the access recorded.

> If SMS/network fails during defense, set `OTP_MODE=demo` in backend `.env` and restart —
> the OTP is shown instead of sent, so the demo never blocks.

## 6. Useful scripts

| Command | What |
|---------|------|
| `npx prisma studio` | Visual DB browser (see encrypted rows) |
| `npm run seed` | Re-load demo data (idempotent) |
| `npx prisma migrate reset` | Wipe + re-migrate + re-seed (careful) |

## Troubleshooting

- **Migrate fails** → check `DATABASE_URL` and `sslmode=require`.
- **AI errors** → check `GEMINI_API_KEY`; app should still save records (AI is non-blocking).
- **No SMS** → check BulkSMSBD balance/sender ID, or use `OTP_MODE=demo`.
- **CORS error** → set `CORS_ORIGIN` to the frontend URL.
