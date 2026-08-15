# HealthNexus BD — Non-Functional Requirements (NFR)

> Each NFR with a concrete implementation action and a done-check.
> Security details live in [SECURITY.md](./SECURITY.md); this is the wider quality set.

## 1. Security
See [SECURITY.md](./SECURITY.md) for the full plan. Summary: bcrypt passwords, JWT + RBAC,
AES-256 at rest, TLS in transit, Zod validation, rate limiting, immutable audit log,
secrets in `.env`.

## 2. Reliability & availability

| Requirement | Action | Done when |
|-------------|--------|-----------|
| No unhandled crashes | Global error middleware + try/catch on all async | Bad input returns JSON, server stays up |
| Consistent multi-step ops | Prisma `$transaction` for consent/OTP grant, record+prescription | Partial failure rolls back |
| External-service failure tolerance | Wrap Gemini/SMS/email in try/catch with fallback; AI failure ≠ request failure | Record saves even if AI/SMS is down |
| Health monitoring | `GET /api/health` returns db + uptime status | Endpoint returns 200 with status |
| Server logging | Pino/Winston with levels; no secrets logged | Errors traceable in logs |

## 3. Performance & load handling

| Requirement | Action | Done when |
|-------------|--------|-----------|
| Fast queries | DB indexes (already in schema: patientId, doctorId+status, patientId+createdAt) | Key lookups use indexes |
| Bounded responses | Pagination (`page`,`limit`) on all list endpoints | No unbounded list query |
| Connection efficiency | Prisma connection pooling (default); pooled URL on Neon | No pool exhaustion under load |
| Non-blocking AI | Gemini calls async; don't block the response path | Record create not blocked by AI |
| Payload limits | Body size limit; PDF upload size cap | Oversized requests rejected (413) |
| Frontend perf | Code-split routes, lazy-load heavy views, compressed assets | Core Web Vitals in range |

## 4. Scalability

| Requirement | Action |
|-------------|--------|
| Horizontal scale | Stateless API (JWT, no server session) → run N instances behind a load balancer |
| DB growth | Indexed + paginated; archive strategy for audit logs later |
| Stateless files | Store uploads in object storage (Cloudinary/S3) for multi-instance |

## 5. Maintainability

| Requirement | Action |
|-------------|--------|
| Clean structure | Module → routes/controller/service/schema; files < 300 lines |
| Consistency | Shared response envelope, shared error class, shared validators |
| Type safety | TypeScript strict; Zod-inferred types; no `any` |
| Docs | This `docs/` set kept in sync with code |

## 6. Usability & accessibility

| Requirement | Action |
|-------------|--------|
| Responsive | Mobile + desktop layouts (from Figma); no horizontal scroll |
| Accessible | Semantic HTML, ARIA labels, keyboard nav, focus states, contrast ≥ WCAG AA |
| Clear feedback | Loading, success, and user-friendly error states on every action |
| Low-tech friendly | Simple flows, SMS-based OTP works on basic phones |

## 7. Portability & config

| Requirement | Action |
|-------------|--------|
| Environment-driven | All config via `.env` (see [ENV.md](./ENV.md)); nothing hardcoded |
| Reproducible setup | `npm install` → `prisma migrate` → `seed` → `dev` (see [SETUP.md](./SETUP.md)) |
| Deploy-ready | Frontend (Vercel), backend (Railway/Render), DB (Neon) |

## 8. Compliance & privacy (scope-appropriate)

| Requirement | Action |
|-------------|--------|
| Data minimization | De-identify data sent to Gemini |
| Consent-first access | No doctor read without an active session |
| Transparency | Patient-visible audit log |
| Retention | Encrypted at rest; deletion cascades where appropriate |

> Note: full enterprise HIPAA certification is **out of scope** (stated in SRS). The system
> follows HIPAA-style technical safeguards (encryption, access control, audit) as a model.

---

## Verification matrix (how to prove each at defense)

| NFR | Demo/evidence |
|-----|---------------|
| Security | Show encrypted DB row (unreadable) + audit log |
| Reliability | Kill AI key → record still saves; `/health` green |
| Performance | Paginated list; index in schema |
| Scalability | Explain stateless JWT design |
| Accessibility | Keyboard-navigate a form; contrast check |
| Consent | Live OTP flow (real SMS) with fallback demo mode |
