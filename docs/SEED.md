# HealthNexus BD — Seed / Demo Data

> What `prisma/seed.ts` should create so the app is demo-ready (login, browse, live
> consent flow). Numbers/IDs are realistic for a believable defense. All demo users
> share one known password for convenience: **`Demo@1234`** (change before any real use).

## Accounts

### Admin (1)
| Name | Email | Level |
|------|-------|-------|
| System Admin | admin@healthnexus.bd | super |

### Doctors (6, BMDC-verified, varied specialties)
| Name | BMDC No. | Specialization | Email |
|------|----------|----------------|-------|
| Dr. Ayesha Karim | A-29871 | Cardiologist | ayesha.karim@hn.bd |
| Dr. Tanvir Ahmed | A-31245 | Internal Medicine | tanvir.ahmed@hn.bd |
| Dr. Nusrat Jahan | A-28110 | Endocrinologist | nusrat.jahan@hn.bd |
| Dr. Sabbir Hossain | A-33902 | Nephrologist | sabbir.hossain@hn.bd |
| Dr. Farhana Islam | A-30567 | Pediatrician | farhana.islam@hn.bd |
| Dr. Imran Kabir | A-27654 | General Physician | imran.kabir@hn.bd |

> Also seed **1–2 doctors with `status=pending`** so the Admin "Verify Doctors" queue has content to demo.

### Diagnostic Labs (4, DGHS-approved)
| Center | License No. | Address |
|--------|-------------|---------|
| PathCare Diagnostics | DGHS-LAB-0099 | Dhanmondi, Dhaka |
| Popular Diagnostic Center | DGHS-LAB-0142 | Shyamoli, Dhaka |
| Ibn Sina Lab | DGHS-LAB-0210 | Mirpur, Dhaka |
| LabAid Diagnostics | DGHS-LAB-0301 | Chittagong |

> Also seed **1 lab with `status=pending`** for the Admin "Verify Labs" demo.

### Patients (8–10, with realistic clinical profiles)
| Name | UHID | Blood | Allergies | Chronic |
|------|------|-------|-----------|---------|
| Rahim Uddin | BD-2026-01234 | B+ | Penicillin, Peanuts | Type 2 Diabetes, Hypertension |
| Karim Ahmed | BD-2026-01235 | O+ | — | Asthma |
| Fatema Begum | BD-2026-01236 | A+ | Sulfa drugs | Hypothyroidism |
| Jamal Hossain | BD-2026-01237 | AB+ | — | CKD Stage 2 |
| Ayesha Siddika | BD-2026-01238 | O- | Latex | — |
| Sohel Rana | BD-2026-01239 | B- | Aspirin | Hypertension |
| Nasrin Akter | BD-2026-01240 | A- | — | Type 1 Diabetes |
| Mizanur Rahman | BD-2026-01241 | O+ | Penicillin | Dyslipidemia |

> UHID format: `BD-YYYY-XXXXX`. NID: 10–17 digit realistic dummy numbers.

## Clinical data

- **Medical records (15–20):** spread across patients, created by various doctors.
  Include diagnosis, symptoms (JSON), `isVerified=true`. Content **AES-256 encrypted**
  at seed time (use the same encryption util the app uses).
- **Prescriptions:** attach to most records — medications (name/dose/frequency/duration)
  + recommended tests (which become lab prescriptions).
- **Lab reports (8–10):** uploaded by labs against prescribed tests; `fileRefEncrypted`
  points to a sample PDF in `/uploads`. Use 2–3 placeholder PDFs.
- **AI summaries (4–6):** a few records with a sample summary + interaction/allergy
  alerts (e.g. Rahim: "Chronic diabetic; allergic to penicillin; on Metformin" + a
  penicillin allergy alert) so the AI feature demos without a live call.
- **Audit logs (10–15):** sample login/view/grant/revoke entries so the audit screens
  aren't empty.
- **One active AccessSession** (a doctor ↔ a patient) so "Active Sessions" and
  "Open Records" demo immediately.

## Notes

- Keep the seed **idempotent** (clear tables or upsert) so `npm run seed` can re-run.
- Encrypt record content and file refs with the real AES util — proves encryption works.
- Realistic BMDC/DGHS numbers make the demo believable to the board.
- Print a short summary at the end (counts + the shared demo password) for convenience.
