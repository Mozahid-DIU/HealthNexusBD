# HealthNexus BD — Architecture

> System design and folder structure for implementation. Pairs with
> [SRS](../HealthNexus-BD-SRS.md), [Database](../HealthNexus-BD-Database.md),
> [UML](../HealthNexus-BD-UML.md), and the Prisma schema (`prisma/schema.prisma`).

## 1. Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19 + Vite + TypeScript + Tailwind CSS v4 |
| Backend | Node.js + Express + TypeScript |
| ORM / DB | Prisma + PostgreSQL (Neon / Supabase cloud) |
| Auth | JWT (access + refresh), bcrypt password hashing |
| Encryption | AES-256-GCM for records & lab files at rest |
| AI | Google Gemini API |
| SMS OTP | BulkSMSBD (consent OTP) |
| Email OTP | Gmail SMTP via Nodemailer (forgot password) |
| File storage | Local `/uploads` (dev) → Cloudinary/S3 (optional prod) |
| Validation | Zod at every API boundary |

## 2. High-level flow

```
React SPA  ──HTTPS/JWT──►  Express API  ──Prisma──►  PostgreSQL
                                │
                                ├─► AES-256 util  (encrypt/decrypt records)
                                ├─► Gemini API    (AI clinical summary)
                                ├─► BulkSMSBD      (consent OTP via SMS)
                                ├─► Nodemailer     (forgot-password OTP via email)
                                └─► Audit logger   (append-only)
```

## 3. Backend folder structure

```
backend/
├── prisma/
│   ├── schema.prisma          # (already exists — copy from project root)
│   └── seed.ts                # demo data (see SEED.md)
├── src/
│   ├── config/
│   │   ├── env.ts             # typed, validated env (Zod)
│   │   └── prisma.ts          # PrismaClient singleton
│   ├── middleware/
│   │   ├── auth.ts            # verify JWT, attach req.user
│   │   ├── rbac.ts            # requireRole('doctor'), etc.
│   │   ├── rateLimit.ts       # login / OTP limiters
│   │   ├── error.ts           # global error handler
│   │   └── validate.ts        # Zod schema runner
│   ├── modules/
│   │   ├── auth/              # register, login, refresh, forgot-password
│   │   ├── patient/           # profile, records, consent inbox, audit
│   │   ├── doctor/            # search patient, request access, records, prescribe
│   │   ├── lab/               # search, prescribed tests, upload report
│   │   ├── consent/           # OTP send/verify, sessions, revoke
│   │   ├── admin/             # verify doctors/labs, users, activity
│   │   └── ai/                # Gemini summary generation
│   │       # each module: *.routes.ts, *.controller.ts, *.service.ts, *.schema.ts
│   ├── utils/
│   │   ├── encryption.ts      # AES-256-GCM encrypt/decrypt
│   │   ├── jwt.ts             # sign/verify tokens
│   │   ├── otp.ts             # generate, hash, verify OTP
│   │   ├── sms.ts             # BulkSMSBD client (+ OTP_MODE demo fallback)
│   │   ├── email.ts           # Nodemailer client
│   │   ├── uhid.ts            # UHID generator (BD-YYYY-XXXXX)
│   │   ├── audit.ts           # writeAudit(actor, action, ...)
│   │   └── logger.ts          # Pino/Winston
│   ├── app.ts                 # express app + middleware wiring
│   └── server.ts              # start + health check
├── .env                       # secrets (never commit)
├── .env.example               # template (see ENV.md)
└── package.json
```

## 4. Request lifecycle (every protected route)

```
1. rateLimit         → throttle abusive callers
2. auth              → verify JWT, load req.user
3. rbac              → check role is allowed
4. validate (Zod)    → validate body/params/query
5. controller        → thin: parse req, call service
6. service           → business logic + Prisma + utils
7. audit             → log the action (append-only)
8. error middleware  → catch, map to safe JSON response
```

## 5. Layering rule (keep it clean)

- **Routes** → wiring only.
- **Controllers** → HTTP in/out only, no business logic.
- **Services** → all business logic, DB, encryption, external calls.
- **Utils** → pure, reusable helpers.
- Files stay < 300 lines; one responsibility each.

## 6. Consent flow (the core mechanism)

```
Doctor: POST /consent/request  (patientUhid)
   → create AccessSession(status=active-pending), generate OTP,
     hash+store OtpToken, SMS OTP to patient's phone (BulkSMSBD)
Patient app shows "OTP sent" (patient approves by sharing the code)
Doctor: POST /consent/verify  (sessionId, otp)
   → verify hash + expiry + attempts, mark session active,
     write audit(grant) → doctor can now read records
Auto-expire: session.expiresAt passes → status=expired (revoked on read)
Patient: POST /consent/:id/revoke  → status=revoked, audit(revoke)
```

## 7. Deployment (later)

| Piece | Host |
|-------|------|
| Frontend | Vercel / Netlify |
| Backend | Railway / Render |
| Database | Neon / Supabase |
| Files | Cloudinary / S3 (or server disk) |
