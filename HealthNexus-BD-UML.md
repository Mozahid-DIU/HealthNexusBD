# 🏥 HealthNexus BD — UML Diagrams

**AI-Powered Unified Patient Health Record (UPHR) System for Bangladesh**
Project Manager deliverable · UML v1.0

> Render tip: These are **Mermaid** diagrams. They render automatically on GitHub and in VS Code with the *Markdown Preview Mermaid Support* extension. Paste any block into <https://mermaid.live> to export PNG/SVG.

---

## 1. Use Case Diagram

Actors: **Patient, Doctor, Diagnostic Lab, Hospital/Admin** (primary) and **AI Engine (Gemini), Mock BMDC, OTP/SMS Service** (secondary/support systems).

```mermaid
flowchart LR
    %% Actors
    Patient([👤 Patient])
    Doctor([🩺 Doctor])
    Lab([🔬 Diagnostic Lab])
    Admin([🏢 Hospital / Admin])
    AI([🤖 AI Engine - Gemini])
    BMDC([📇 Mock BMDC DB])
    OTP([📲 OTP / SMS Service])

    subgraph HealthNexusBD["HealthNexus BD System"]
        UC1((Register / Login))
        UC2((Manage Own Profile & Basic Health Info))
        UC3((View Own Medical History))
        UC4((Grant Access via OTP Consent))
        UC5((View Audit Log))
        UC6((Upload Own Documents))

        UC7((BMDC-Verified Registration))
        UC8((Search Patient by UHID / Mobile))
        UC9((Request Record Access))
        UC10((View AI Clinical Summary))
        UC11((Add Diagnosis & Symptoms))
        UC12((Write Digital Prescription))
        UC13((Recommend Tests & Follow-up))

        UC14((Search Patient by UHID))
        UC15((Upload Verified Lab Report / PDF))

        UC16((Verify Doctors - BMDC))
        UC17((Manage Hospitals & Users))
        UC18((View Statistics))
        UC19((Monitor Audit Trail))

        UC20((Generate Clinical Summary))
        UC21((Drug Interaction & Allergy Alerts))
    end

    %% Patient
    Patient --- UC1 & UC2 & UC3 & UC4 & UC5 & UC6
    %% Doctor
    Doctor --- UC1 & UC7 & UC8 & UC9 & UC10 & UC11 & UC12 & UC13
    %% Lab
    Lab --- UC1 & UC14 & UC15
    %% Admin
    Admin --- UC1 & UC16 & UC17 & UC18 & UC19

    %% System-to-system
    UC9 -. include .-> UC4
    UC4 -. uses .-> OTP
    UC7 -. verify .-> BMDC
    UC16 -. verify .-> BMDC
    UC10 -. include .-> UC20
    UC20 -. uses .-> AI
    UC21 -. uses .-> AI
    UC10 -. extend .-> UC21
```

---

## 2. Activity Diagram — Doctor Consultation Flow (End-to-End)

Covers the full clinical journey: patient search → OTP consent → AI summary → consultation → verified record.

```mermaid
flowchart TD
    Start([Patient arrives at Hospital]) --> Login[/Doctor logs in - JWT/]
    Login --> Verified{Doctor BMDC<br/>Verified?}
    Verified -- No --> Block[Deny access -<br/>await Admin verification]
    Block --> End1([End])

    Verified -- Yes --> Search[Doctor searches patient<br/>by UHID / Mobile]
    Search --> Found{Patient<br/>found?}
    Found -- No --> NotFound[Show 'No patient record']
    NotFound --> End2([End])

    Found -- Yes --> SendOTP[System sends OTP<br/>to patient mobile]
    SendOTP --> EnterOTP[/Patient shares OTP<br/>Doctor enters it/]
    EnterOTP --> ValidOTP{OTP valid<br/>& not expired?}
    ValidOTP -- No --> Retry{Attempts<br/>left?}
    Retry -- Yes --> SendOTP
    Retry -- No --> Lock[Lock session -<br/>log attempt]
    Lock --> End3([End])

    ValidOTP -- Yes --> Grant[Grant session-scoped access<br/>Write audit log entry]
    Grant --> AISummary[AI generates Clinical Summary:<br/>chronic disease, allergies,<br/>drug interactions, timeline]
    AISummary --> Review[Doctor reviews history<br/>+ AI summary]
    Review --> Consult[Doctor examines patient]

    Consult --> Record[Add Diagnosis, Symptoms,<br/>Digital Prescription]
    Record --> NeedTest{Test<br/>needed?}
    NeedTest -- Yes --> Recommend[Recommend Tests]
    NeedTest -- No --> FollowUp
    Recommend --> FollowUp[Add Follow-up Date]
    FollowUp --> Save[Save as VERIFIED Medical Record<br/>AES-256 encrypt · audit log]
    Save --> SessionEnd[Session access revoked]
    SessionEnd --> End4([End])
```

---

## 3. Sequence Diagram — OTP Consent → AI Summary → Verified Record

Lifelines: **Patient, Doctor, Frontend (React), Backend (Express), Database (PostgreSQL), OTP Service, AI Engine (Gemini)**.

```mermaid
sequenceDiagram
    autonumber
    actor P as 👤 Patient
    actor D as 🩺 Doctor
    participant FE as Frontend (React)
    participant BE as Backend (Express)
    participant DB as PostgreSQL
    participant OTP as OTP/SMS Service
    participant AI as AI Engine (Gemini)

    D->>FE: Login (email, password)
    FE->>BE: POST /auth/login
    BE->>DB: Verify credentials + BMDC status
    DB-->>BE: Doctor verified ✔ + JWT claims
    BE-->>FE: JWT (role: doctor)

    D->>FE: Search patient (UHID / mobile)
    FE->>BE: GET /patients?uhid=BD-2026-9941 (JWT)
    BE->>DB: Lookup patient
    DB-->>BE: Patient profile (minimal)
    BE-->>FE: Patient found

    D->>FE: Request record access
    FE->>BE: POST /consent/request-otp
    BE->>OTP: Send OTP to patient mobile
    OTP-->>P: SMS with OTP code
    P-->>D: Shares OTP verbally
    D->>FE: Enter OTP
    FE->>BE: POST /consent/verify-otp
    BE->>DB: Validate OTP (expiry, attempts)
    DB-->>BE: Valid ✔
    BE->>DB: Create session grant + audit log
    BE-->>FE: Access token (session-scoped)

    FE->>BE: GET /records/{uhid}/summary
    BE->>DB: Fetch full medical history (decrypt AES-256)
    DB-->>BE: History records
    BE->>AI: Summarize history + interaction/allergy check
    AI-->>BE: Clinical Summary + alerts
    BE-->>FE: Records + AI Summary
    FE-->>D: Display history + AI Clinical Summary

    D->>FE: Add diagnosis, prescription, tests, follow-up
    FE->>BE: POST /records (verified)
    BE->>DB: Store encrypted VERIFIED record + audit log
    DB-->>BE: Saved ✔
    BE-->>FE: 201 Created
    FE-->>D: Record saved · session closes
    Note over BE,DB: Access auto-revoked after session;<br/>Patient can view "who accessed" in Audit Log
```

---

### PM Notes
- **Naming:** All references updated to **HealthNexus BD**.
- **Consent model:** OTP grants **session-scoped** access only (per the spec) — reflected in all three diagrams.
- **Verified vs Unverified:** Doctor/Lab records = *Verified*; patient self-uploads = *Unverified* (shown in Use Case UC6/UC15). Want a dedicated activity diagram for the **Lab Upload** flow too? I can add it.
