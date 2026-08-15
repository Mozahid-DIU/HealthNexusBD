# HealthNexus BD — Security

> Security controls, how each is implemented, and a pre-commit checklist.
> Health data is sensitive → security is a first-class requirement, not an add-on.

## 1. Security goals (map to the project pitch)

| Goal | Control |
|------|---------|
| Data ownership | Patient-controlled, OTP consent, session-scoped access |
| Confidentiality | AES-256 encryption at rest + TLS in transit |
| Integrity | Immutable append-only audit log |
| Authenticity | JWT auth + BMDC/DGHS verification |
| Accountability | Every access logged (who/what/when/IP) |

---

## 2. Authentication

- **Passwords** hashed with **bcrypt** (cost ≥ 12) or argon2. Never stored or logged in plaintext; encryption is *not* used for passwords (one-way hashing only).
- **JWT**: short-lived **access token** (~15 min) + longer **refresh token** (~7 days). Access token carries `{ userId, role }`. Refresh tokens are rotated and revocable on logout.
- Secrets (`JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`) live in `.env`, min 32 random chars, never in code.
- Doctor/lab accounts stay `pending` and **cannot act** until admin approval.

## 3. Authorization (RBAC)

- `rbac` middleware enforces role per route (`requireRole('doctor')`).
- Doctors can read a patient's records **only with an active `AccessSession`** — checked in the service layer, not just the route.
- Labs can upload only against an existing **prescribed test**; they cannot read patient history.
- Admin actions are restricted to `role=admin` and fully audited.

## 4. Consent & OTP

- Consent OTP is **6 digits**, **hashed** (bcrypt) before storage — never stored in plaintext (`OtpToken.codeHash`).
- **Expiry** enforced (`expiresAt`, e.g. 5 min) and **attempt limit** (`attempts`, e.g. 5) → lockout on exceed.
- OTP is single-use (`isUsed`) and tied to one `AccessSession`.
- Access is **session-scoped**: `expiresAt` auto-expires; patient can `revoke` early.
- OTP delivery: **BulkSMSBD** to the patient's phone; the doctor enters the shared code.

## 5. Encryption

- **At rest:** medical record content (`content_encrypted`) and lab file references (`file_ref_encrypted`) encrypted with **AES-256-GCM**.
  - Random 12-byte **IV per record**; GCM **auth tag** stored to detect tampering.
  - Key from `AES_SECRET_KEY` (32 bytes / 64 hex) in `.env` — **never** in the database, so a DB dump alone is unreadable.
  - Generate: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`.
- **In transit:** HTTPS/TLS everywhere; AI (Gemini), SMS, and email calls over TLS.
- Data sent to Gemini is **de-identified** (strip name/UHID/NID) — only clinical text.

## 6. Input validation & injection

- **Zod** schema on every route (body/params/query) → fail fast with safe messages.
- **Prisma** parameterizes all queries → SQL injection prevented by design (no raw string concatenation).
- File uploads: validate MIME type (PDF only) and size cap; store outside web root; never trust the original filename.

## 7. Transport & headers

- **Helmet** for secure headers (`X-Content-Type-Options`, `X-Frame-Options: DENY`, HSTS, etc.).
- **CORS** locked to the known frontend origin(s).
- Cookies (if used for refresh token): `httpOnly`, `secure`, `sameSite`.

## 8. Rate limiting & abuse

- `express-rate-limit` on `/auth/login`, `/auth/forgot-password`, `/consent/request`, `/consent/verify`, `/consent/resend`.
- Generic auth errors ("Invalid credentials") — no user enumeration.
- OTP resend throttled; lockout after repeated failures.

## 9. Audit log (integrity)

- **Append-only**: insert only; no update/delete API, admin has no delete permission.
- Records actor, action, subject patient, resource, IP, timestamp.
- Optional hardening: hash-chain each entry (store hash of previous) to make tampering detectable.

## 10. Secrets & config

- All secrets in `.env` (git-ignored). `.env.example` documents keys with **no real values**.
- Validate presence of required secrets at startup (`config/env.ts` with Zod) — fail fast if missing.
- Rotate any key that may have leaked.

## 11. Error handling & logging

- Global error middleware maps errors to safe JSON; stack traces never sent to clients.
- Server logs (Pino/Winston) exclude secrets, passwords, OTPs, and decrypted content.

---

## ✅ Pre-commit security checklist

- [ ] No hardcoded secrets / API keys / passwords (grep before commit).
- [ ] `.env` git-ignored; `.env.example` has placeholders only.
- [ ] All new routes: auth + rbac + Zod validation.
- [ ] Passwords hashed (bcrypt); OTPs hashed; nothing sensitive logged.
- [ ] Medical content & lab files AES-256 encrypted before store.
- [ ] Doctor record access checks an active AccessSession.
- [ ] Rate limiting on auth/OTP endpoints.
- [ ] Errors don't leak internals; generic auth failures.
- [ ] Audit written for login, view, create, grant, revoke.
- [ ] Data to Gemini de-identified.

---

## OTP_MODE (defense safety net)

`OTP_MODE=real` sends via BulkSMSBD/email. `OTP_MODE=demo` returns/prints the OTP
(no external send) so a live demo never fails on network/balance issues. **Security note:**
demo mode is for local demo only — never enable it in a real deployment.
