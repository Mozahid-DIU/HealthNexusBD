# HealthNexus BD — REST API

> All endpoints prefixed with `/api`. All responses use one envelope:
> `{ "success": boolean, "data": <payload|null>, "error": <message|null>, "meta": {...} }`
> Auth via `Authorization: Bearer <accessToken>`. All input validated with Zod.

Legend — 🔓 public · 🔒 auth required · roles in `[ ]`.

---

## Auth — `/api/auth`

| Method | Path | Access | Purpose |
|--------|------|--------|---------|
| POST | `/register` | 🔓 | Register (role: patient/doctor/lab). Doctor/lab start `pending` until admin approval. Patient gets a UHID. |
| POST | `/login` | 🔓 | Email/phone + password → access + refresh JWT. |
| POST | `/refresh` | 🔓 | Refresh token → new access token. |
| POST | `/logout` | 🔒 | Invalidate refresh token. |
| GET | `/me` | 🔒 | Current user + role profile. |
| POST | `/forgot-password` | 🔓 | Send **email OTP** to registered email. |
| POST | `/reset-password` | 🔓 | Verify email OTP + set new password. |

**Register body (patient):** `{ fullName, email, phone, password, nid, dateOfBirth?, gender?, bloodGroup? }`
**Register body (doctor):** `{ fullName, email, phone, password, bmdcNumber, specialization }`
**Register body (lab):** `{ centerName, email, phone, password, licenseNumber, address }`

---

## Consent Engine — `/api/consent` (the core feature)

| Method | Path | Access | Purpose |
|--------|------|--------|---------|
| POST | `/request` | 🔒 [doctor] | Doctor requests access to a patient (by UHID). Creates session + **sends SMS OTP to patient's phone** (BulkSMSBD). |
| POST | `/verify` | 🔒 [doctor] | Doctor submits the OTP the patient shared → grants session. `{ sessionId, otp }` |
| POST | `/resend` | 🔒 [doctor] | Resend OTP (respects attempt/rate limits). |
| GET | `/sessions` | 🔒 [doctor] | Doctor's active sessions. |
| GET | `/pending` | 🔒 [patient] | Patient's pending/active consent requests (inbox). |
| POST | `/:id/approve` | 🔒 [patient] | Patient approves → triggers OTP send. |
| POST | `/:id/deny` | 🔒 [patient] | Patient denies the request. |
| POST | `/:id/revoke` | 🔒 [patient] | Patient revokes an active session early. |

> OTP is **entered on the doctor's screen** (patient shares the code). Attempts capped,
> expiry enforced, session auto-expires. Every grant/revoke is audited.

---

## Patient — `/api/patient` 🔒 [patient]

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/profile` | Own profile (UHID, allergies, chronic diseases, blood group). |
| PATCH | `/profile` | Update editable fields. |
| GET | `/records` | Own medical records (paginated, decrypted). |
| GET | `/records/:id` | One record + prescription + AI summary. |
| GET | `/lab-reports` | Own lab reports (decrypted file links). |
| GET | `/audit` | Own audit log — who accessed data & when (paginated). |

---

## Doctor — `/api/doctor` 🔒 [doctor, verified]

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/search?uhid=` or `?phone=` | Find a patient to request access. |
| GET | `/patients` | Patients with active sessions. |
| GET | `/patients/:id/records` | Read patient records **(requires active session)**. Audited as `view`. |
| POST | `/records` | Create a medical record (diagnosis, symptoms) → AES-256 encrypted. |
| POST | `/records/:id/prescription` | Add prescription (medications, recommended tests). |
| POST | `/records/:id/ai-summary` | Generate AI clinical summary (Gemini). |

---

## Lab — `/api/lab` 🔒 [lab, approved]

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/search?uhid=` | Find patient + their **prescribed tests** (not full history). |
| POST | `/reports` | Upload a report PDF for a prescribed test → AES-256 encrypted, linked to prescription. |
| GET | `/uploads` | Lab's own uploaded reports (paginated). |

---

## Admin — `/api/admin` 🔒 [admin]

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/dashboard` | Stats (counts, pending verifications, activity). |
| GET | `/doctors?status=pending` | Doctor verification queue. |
| POST | `/doctors/:id/approve` | Approve → mark BMDC-verified, status active. |
| POST | `/doctors/:id/reject` | Reject with reason. |
| GET | `/labs?status=pending` | Lab verification queue. |
| POST | `/labs/:id/approve` | Approve lab. |
| POST | `/labs/:id/reject` | Reject with reason. |
| GET | `/users` | All users (filter by role/status, paginated). |
| POST | `/users/:id/suspend` | Suspend / reactivate a user. |
| GET | `/audit` | System-wide audit log (paginated, filterable). |

---

## Utility

| Method | Path | Access | Purpose |
|--------|------|--------|---------|
| GET | `/api/health` | 🔓 | Liveness/readiness check. |

---

## Conventions

- **Pagination:** `?page=1&limit=20` → `meta: { total, page, limit }`.
- **Errors:** never leak internals — `{ success:false, error:"Human-safe message" }` + proper HTTP status (400/401/403/404/409/429/500).
- **Rate limits:** `/auth/login`, `/auth/forgot-password`, `/consent/request`, `/consent/verify`, `/consent/resend`.
- **Audit-written actions:** login, record view, record create, consent grant/revoke.
