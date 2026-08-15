# Software Requirements Specification (SRS)

## HealthNexus BD
### An AI-Powered Web-Based Unified Patient Health Record (UPHR) System for Bangladesh

---

**Submitted By**
_[Team Member 1 Name] (ID: __________)_
_[Team Member 2 Name] (ID: __________)_
_[Team Member 3 Name] (ID: __________)_

**Submitted To**
_[Instructor Name], [Designation], Dept. of Software Engineering_

**Course Information**
Course Title: _[Course Title]_
Course Code: _[Course Code]_

_[Date]_

---

> **How to use this file:** This is the full SRS text. Export each `.drawio` diagram (in the `diagrams/` folder) as a **high-resolution PNG** and drop it where each `Figure` placeholder appears.
> In draw.io: **File → Export as → PNG…**, check **Zoom = 200–300%**, **Border = 10**, **Transparent = OFF (white)**, then Export. This keeps the images clear and readable in the final PDF/Word.

---

## Contents

1. Introduction
   - 1.1 Problem Statement
   - 1.2 Purpose
   - 1.3 Scope
   - 1.4 Out-of-Scope
   - 1.5 Real-Life Scenario
   - 1.6 Definitions, Acronyms, Abbreviations
   - 1.7 Stakeholders
2. Design and Implementation Constraints
   - 2.1 Programming Language
   - 2.2 Database & Servers
   - 2.3 Technical Constraints
3. User Classes and Characteristics
   - 3.1 Patients
   - 3.2 Doctors
   - 3.3 Diagnostic Labs
   - 3.4 System Administrator
   - 3.5 Access Control Model
4. Functional Requirements (FR)
5. Non-Functional Requirements (NFR)
6. External Interface Requirements
7. System Models and Diagrams
   - 7.1 Use Case Diagram
   - 7.2 Use Case Scenarios (UC-01 … UC-10)
   - 7.3 Entity Relationship Diagram (ERD)
   - 7.4 Database Schema Definition
   - 7.5 Activity Diagram
8. Activity Diagram Description
   - 8.8 Sequence Diagram
   - 8.9 Sequence Scenario Description
9. Future Enhancements
10. Team Member Responsibility Matrix

---

# 1. Introduction

This project presents an AI-powered web-based platform designed to unify fragmented patient health records across Bangladesh. HealthNexus BD digitally integrates patients, doctors, diagnostic labs, and hospital administrators into a single secure system, giving every citizen one lifelong **Unified Health ID (UHID)** and giving verified doctors consent-based access to a patient's complete, encrypted medical history — enriched with AI-generated clinical summaries.

## 1.1 Problem Statement

In Bangladesh, patient medical records are scattered across different hospitals, clinics, and diagnostic centers, mostly on paper. When a patient visits a new doctor, the complete medical history — past diagnoses, chronic diseases, allergies, and prescriptions — is rarely available. This fragmentation leads to repeated tests, dangerous drug interactions, misdiagnosis, and wasted time and money. There is no unified, secure, patient-controlled system where a citizen's health data follows them safely across providers.

## 1.2 Purpose

The purpose of this Software Requirements Specification (SRS) is to provide a comprehensive and structured description of the **HealthNexus BD** system. HealthNexus BD is a web-based platform that consolidates a patient's lifelong medical history under a single Unified Health ID, secured by OTP-based consent and AES-256 encryption, and assisted by an AI engine that summarizes clinical history and flags drug-interaction and allergy risks.

This document serves as a formal reference for developers, supervisors, testers, and stakeholders to clearly understand the system requirements and expected behavior.

## 1.3 Scope

The system will:

- Allow user registration and role-based authentication (Patient, Doctor, Diagnostic Lab, Admin).
- Issue every patient a unique lifelong **Unified Health ID (UHID)**.
- Verify doctors against a (mock) **BMDC** registry before granting clinical access.
- Enforce **OTP-based, session-scoped patient consent** before any doctor can view a record.
- Provide **AI-generated clinical summaries** with drug-interaction and allergy alerts (Gemini).
- Store all medical records and lab reports **encrypted at rest (AES-256)**.
- Allow verified diagnostic labs to upload verified test reports (PDF) linked to a patient.
- Maintain an immutable **audit log** so patients can see exactly who accessed their data.
- Allow administrative verification, user management, and system-wide monitoring.

## 1.4 Out-of-Scope

The system will not:

- Provide real-time telemedicine / video consultation.
- Integrate online payment or insurance-claim gateways.
- Replace hospital-grade EMR/HIS infrastructure or medical devices.
- Provide autonomous AI diagnosis or treatment decisions (AI is advisory only).
- Connect to the real national BMDC or NID database (a mock service is used for the academic scope).

## 1.5 Real-Life Scenario

A patient named Rahim, who has diabetes and a penicillin allergy, travels from Rajshahi to Dhaka and falls ill. He visits a new hospital where the doctor has never seen him before. In the current system, the doctor has no access to Rahim's history — his chronic diabetes, his penicillin allergy, or his current medications. The doctor may repeat expensive tests, or worse, prescribe a drug that interacts dangerously with Rahim's existing medication.

With HealthNexus BD, the doctor searches Rahim by his UHID. The system sends an OTP to Rahim's mobile; Rahim shares it, granting the doctor **session-scoped** access. The AI engine instantly summarizes Rahim's history and flags: *"Chronic diabetic; allergic to penicillin; currently on Metformin."* The doctor treats him safely, writes a verified digital prescription, and the record is encrypted and saved. Later, Rahim opens his audit log and sees exactly which doctor accessed his data and when. The access is automatically revoked after the session ends.

## 1.6 Definitions, Acronyms, Abbreviations

| Term | Definition |
|------|------------|
| SRS | Software Requirements Specification |
| UPHR | Unified Patient Health Record |
| UHID | Unique Health ID (lifelong patient identifier, format `BD-YYYY-XXXXX`) |
| ERD | Entity Relationship Diagram |
| OTP | One-Time Password (used for consent verification) |
| BMDC | Bangladesh Medical & Dental Council (doctor verification authority) |
| NID | National ID |
| AES-256 | Advanced Encryption Standard, 256-bit (data-at-rest encryption) |
| JWT | JSON Web Token (session authentication) |
| RBAC | Role-Based Access Control |
| AI | Artificial Intelligence (Gemini clinical summary engine) |
| Admin | System Administrator |
| DBMS | Database Management System |

## 1.7 Stakeholders

- Patients
- Doctors
- Diagnostic Labs
- System Administrator (Hospital / Platform Admin)

---

# 2. Design and Implementation Constraints

This section defines the technical boundaries, architectural limitations, and implementation decisions that shape the development of HealthNexus BD.

## 2.1 Programming Language

**Selected Technology Stack**

- **Frontend:** React.js (TypeScript), HTML, CSS
- **Backend:** Node.js with Express.js (TypeScript)
- **Database:** PostgreSQL (via Prisma ORM)
- **AI Engine:** Google Gemini API
- **Auth/Security:** JWT sessions, bcrypt/argon2 password hashing, AES-256 record encryption

**Justification for Choosing Node.js + PostgreSQL**

- **Strong ecosystem for secure web APIs:** Node.js + Express is well-suited for building RESTful APIs with mature middleware for authentication, validation, and rate limiting.
- **Relational integrity for sensitive health data:** PostgreSQL provides strict referential integrity, ACID transactions, native UUIDs, JSONB for flexible clinical fields, and the `INET` type for audit logging — all critical for a health record system.
- **Type safety end-to-end:** TypeScript on both frontend and backend reduces runtime errors when handling sensitive medical data.
- **Prisma ORM:** Gives a single source of truth for the schema, automatic migrations, and safe, parameterized queries that prevent SQL injection.
- **AI integration:** The Gemini API integrates cleanly over HTTPS to generate clinical summaries and interaction/allergy alerts.

## 2.2 Database & Servers

**Database Management System**

The system uses **PostgreSQL** (relational DBMS).

**Justification for PostgreSQL**

- **Relational Data Modeling:** The system requires structured, related storage for users (role-based), patients, doctors, labs, medical records, consent sessions, OTP tokens, lab reports, AI summaries, and audit logs. PostgreSQL supports primary keys, foreign keys, and normalization.
- **Data Integrity & Constraints:** Referential integrity, unique constraints, transactions, and full ACID compliance protect medical data correctness.
- **Security & Data Types:** Native support for UUIDs, encrypted text fields, JSONB, and `INET` (for logging access IP addresses) supports strong auditability.
- **Performance Optimization:** Indexing on UHID, session status, and audit timestamps ensures fast lookups.

**Server Architecture — Three-Tier**

- **Presentation Layer (Frontend):** React.js browser-based SPA; role-based dashboards for Patient, Doctor, Lab, Admin.
- **Application Layer (Backend):** Node.js + Express REST API handling authentication, BMDC verification, OTP consent, encryption, and AI orchestration.
- **Data Layer:** PostgreSQL database server storing encrypted records and audit logs.

During development the system runs locally (Node + local PostgreSQL). For deployment it can be hosted on a standard Linux (VPS/cloud) environment with a managed PostgreSQL instance.

## 2.3 Technical Constraints

- No integration with the real national BMDC/NID database (a mock verification service is used).
- No online payment or insurance gateway.
- No real-time video consultation.
- AI output is **advisory only** and never replaces a doctor's judgment.
- Limited scalability beyond medium-level user load (academic capstone scope).
- Security includes JWT auth, OTP consent, password hashing, and AES-256 at rest, but not full enterprise/hospital-grade compliance certification (e.g., formal HIPAA audit).

---

# 3. User Classes and Characteristics

This section identifies the primary stakeholders of HealthNexus BD and defines their roles, access levels, technical characteristics, and permissions. The system follows a **Role-Based Access Control (RBAC)** model, further protected by **OTP-based, session-scoped consent** for clinical data.

## 3.1 Patients

**Description**
Patients are the data owners. They hold a lifelong UHID and control who accesses their medical history.

**Technical Characteristics**
- Basic to intermediate digital literacy
- Access via mobile phone or low-cost desktop
- Require a simple, trustworthy interface
- May have limited internet bandwidth

**Permissions & Access Rights**
Patients can:
- Register and manage their own profile and basic health info (blood group, allergies, chronic diseases)
- Receive and hold a unique UHID
- View their own complete medical history and lab reports
- **Grant / revoke doctor access via OTP consent**
- View a full audit log of who accessed their data

Patients cannot:
- Access other patients' data
- Modify doctor-verified medical records
- Access system configuration or admin settings

## 3.2 Doctors

**Description**
Doctors are BMDC-verified clinicians who consult patients and create verified records.

**Technical Characteristics**
- Moderate to high digital familiarity
- Access via desktop or mobile in a clinical setting
- Require fast patient lookup and clear AI summaries

**Permissions & Access Rights**
Doctors can:
- Register with a BMDC number (pending admin approval)
- Search patients by UHID / mobile
- Request record access (triggers patient OTP consent)
- View patient history and **AI clinical summary** after OTP verification
- Record diagnosis and symptoms
- Write digital prescriptions and recommend tests / follow-up

Doctors cannot:
- Access any patient record without valid OTP consent
- Retain access after the consented session expires
- Access administrative dashboards or other doctors' private data

## 3.3 Diagnostic Labs

**Description**
Diagnostic labs perform tests and upload verified reports for patients.

**Technical Characteristics**
- Business/clinical users, desktop-based
- Require patient lookup and secure file upload

**Permissions & Access Rights**
Diagnostic Labs can:
- Register a diagnostic center (pending admin approval)
- Search patients and view prescribed/recommended tests
- Upload verified test reports (PDF), linked to the patient and record

Diagnostic Labs cannot:
- Modify doctor's diagnoses or prescriptions
- Access data unrelated to the tests assigned to them
- Access administrative dashboards

## 3.4 System Administrator

**Description**
The System Administrator monitors, verifies, and maintains the platform.

**Technical Characteristics**
- High technical proficiency
- Knowledge of database/server management
- Access to full dashboard and reporting tools

**Permissions & Access Rights**
The Administrator can:
- Approve or deactivate user accounts
- **Verify doctors (BMDC) and approve diagnostic labs**
- Manage users and role assignments
- Monitor platform-wide activity and statistics
- Monitor the system audit trail
- Maintain database integrity

The Administrator cannot:
- Read the decrypted clinical content of a patient's records without a legitimate, logged reason (patient privacy is preserved; admin sees metadata/audit, not clinical content).

## 3.5 Access Control Model

HealthNexus BD implements **role-based authentication using JWT session tokens** and PostgreSQL-stored role identifiers, layered with **OTP-based session-scoped consent** for clinical data. Each user has:

- A unique User ID (UUID) and role (`patient`, `doctor`, `lab`, `admin`)
- Encrypted (hashed) password storage
- JWT-based session authorization validation
- For clinical access: an additional **OTP-verified, time-boxed `access_session`** that auto-expires

---

# 4. Functional Requirements (FR)

| ID | Requirement Name | Description | Users | Priority |
|----|------------------|-------------|-------|----------|
| FR-1 | User Registration | The system shall allow users to register accounts with valid credentials and role. | All Users | High |
| FR-2 | Secure Login | Users shall log in securely using authenticated credentials (JWT). | All Users | High |
| FR-3 | Password Encryption | The system shall hash all passwords before storing them. | System | High |
| FR-4 | Role-Based Access | The system shall enforce RBAC for all users. | System | High |
| FR-5 | Generate UHID | The system shall issue each patient a unique lifelong Health ID. | System | High |
| FR-6 | Manage Health Profile | Patients shall add/update basic health info (blood group, allergies, chronic diseases). | Patient | High |
| FR-7 | BMDC Doctor Verification | The system shall verify doctors via the (mock) BMDC registry and admin approval. | System / Admin | High |
| FR-8 | Search Patient | Doctors/Labs shall search patients by UHID or mobile. | Doctor / Lab | High |
| FR-9 | OTP Consent Request | The system shall send an OTP to the patient when a doctor requests access. | System | High |
| FR-10 | OTP Verification | The system shall grant session-scoped access only on valid, non-expired OTP. | System | High |
| FR-11 | Session-Scoped Access | The system shall auto-revoke doctor access when the session expires. | System | High |
| FR-12 | AI Clinical Summary | The system shall generate an AI summary with drug-interaction and allergy alerts. | System | High |
| FR-13 | Record Diagnosis & Prescription | Doctors shall record diagnosis, symptoms, and digital prescriptions. | Doctor | High |
| FR-14 | Encrypt Records | The system shall encrypt medical records at rest (AES-256). | System | High |
| FR-15 | Upload Lab Report | Verified labs shall upload verified test reports (PDF) linked to a patient. | Lab | High |
| FR-16 | Audit Logging | The system shall log every record access/action immutably. | System | High |
| FR-17 | View Audit Log | Patients shall view who accessed their data and when. | Patient | High |
| FR-18 | Approve Registrations | Admin shall approve/deactivate doctors and labs. | Admin | High |
| FR-19 | Monitor System | Admin shall monitor platform activity and statistics. | Admin | High |
| FR-20 | Secure Logout | Users shall log out securely. | All Users | Medium |
| FR-21 | Follow-up Notification | The system shall notify patients of follow-up dates and new reports. | System | Medium |

---

# 5. Non-Functional Requirements (NFR)

| Category | Requirement | Priority |
|----------|-------------|----------|
| Performance | The system shall support at least 500 concurrent users under normal conditions. | High |
| Performance | Average API response time shall be under 3 seconds. | High |
| Performance | System uptime shall be at least 99%. | High |
| Security | All passwords shall be hashed (bcrypt/argon2). | High |
| Security | All medical records and lab files shall be encrypted at rest (AES-256). | High |
| Security | Clinical access shall require OTP-based, session-scoped consent. | High |
| Security | OTP codes shall be hashed, attempt-limited, and time-expiring. | High |
| Security | Role-based authorization shall be enforced on every endpoint. | High |
| Security | All access shall be recorded in an immutable audit log. | High |
| Usability | The system shall provide a clean, user-friendly, role-based interface. | Medium |
| Usability | The system shall be mobile responsive. | High |
| Reliability | The system shall perform automatic daily database backups. | High |
| Reliability | The system shall support data recovery in case of failure. | High |
| Reliability | The system shall maintain data integrity during transactions (ACID). | High |
| Privacy | Patients shall retain ownership and consent control over their data. | High |
| System Constraint | Advanced/autonomous AI diagnosis is outside current scope. | Low |
| System Constraint | Real BMDC/NID integration is not implemented in this version. | Low |
| System Constraint | Performance depends on hosting server capacity. | Medium |

---

# 6. External Interface Requirements

## 6.1 User Interfaces

HealthNexus BD shall provide a clean, responsive, role-based web interface for Patients, Doctors, Labs, and Admin. Key UI requirements:

- Responsive design for desktop and mobile
- Consistent navigation menu per role
- Form validation with user-friendly error messages
- Dashboards with real-time status (pending verification, active sessions, new reports)
- Clear, prominent **AI alert banners** (allergy / drug-interaction warnings in red)
- Color-coded status indicators (verified vs unverified records, active vs expired sessions)

## 6.2 Hardware Interfaces

The system is web-based and requires no specialized hardware. Users access it via:

- Smartphones
- Laptops
- Desktop computers

## 6.3 Software Interfaces

HealthNexus BD interacts with:

- Web Browsers (Chrome, Edge, Firefox)
- Web/App Server (Node.js runtime)
- Database Server (PostgreSQL)
- **Google Gemini API** (AI clinical summary generation)
- **OTP / SMS Gateway** (consent verification)
- **Mock BMDC Verification Service** (doctor credential check)

## 6.4 Communication Interfaces

- HTTPS for all client–server communication
- RESTful API for frontend–backend interaction
- JWT-based secure session management
- Encrypted transport (TLS) for all AI and OTP service calls

---

# 7. System Models and Diagrams

## 7.1 Use Case Diagram

> **Figure 1: Use Case Diagram** — _Export from_ `diagrams/HealthNexus-UseCase.drawio` _as PNG (Zoom 200%) and insert here._

The use case diagram shows the four primary actors (Patient, Doctor, Diagnostic Lab, System Admin) and the support systems (AI Engine/Gemini, BMDC Database, OTP/SMS Service), with `<<include>>` (UHID issuance) and `<<extend>>` (AI Insights) relationships.

## 7.2 Use Case Scenarios

### 7.2.1 UC-01: Register / Login

| Field | Description |
|-------|-------------|
| Use Case Name | Register / Login |
| Primary Actor | All Users |
| Precondition | User is not authenticated |
| Postcondition | User is redirected to role-based dashboard |

**Main Success Flow**
1. User selects Register or Login.
2. System displays the authentication form.
3. User enters credentials.
4. System validates input and verifies credentials.
5. System creates an authenticated JWT session.
6. System redirects the user to their role-based dashboard.

### 7.2.2 UC-02: BMDC Doctor Registration

| Field | Description |
|-------|-------------|
| Primary Actor | Doctor |
| Precondition | Doctor has a BMDC number |
| Postcondition | Doctor account approved and portal access granted |

**Main Success Flow**
1. Doctor registers with BMDC number and specialization.
2. System verifies the number against the (mock) BMDC registry.
3. System forwards the request to Admin for approval.
4. Admin reviews and approves the doctor.
5. System grants the doctor portal access.

### 7.2.3 UC-03: Manage Health Profile (Patient)

| Field | Description |
|-------|-------------|
| Primary Actor | Patient |
| Precondition | Patient is logged in |
| Postcondition | Health profile saved |

**Main Success Flow**
1. Patient opens their profile.
2. Patient enters basic health info (blood group, allergies, chronic diseases).
3. Patient submits the form.
4. System validates and saves the profile to the database.
5. System confirms the update.

### 7.2.4 UC-04: Search Patient (Doctor)

| Field | Description |
|-------|-------------|
| Primary Actor | Doctor |
| Precondition | Doctor is verified and logged in |
| Postcondition | Patient located (minimal profile shown) |

**Main Success Flow**
1. Doctor selects Search Patient.
2. Doctor enters the patient's UHID or mobile number.
3. System looks up the patient.
4. System returns a minimal patient profile (no clinical data yet).

### 7.2.5 UC-05: OTP Consent Access

| Field | Description |
|-------|-------------|
| Primary Actor | Doctor (with Patient consent) |
| Precondition | Patient located; patient present with mobile |
| Postcondition | Session-scoped access granted; audit log written |

**Main Success Flow**
1. Doctor requests record access.
2. System sends an OTP to the patient's mobile.
3. Patient shares the OTP with the doctor.
4. Doctor enters the OTP.
5. System validates the OTP (expiry, attempt limit).
6. System grants session-scoped access and writes an audit-log entry.

**Alternative Flow**
- 5a. If OTP is invalid/expired: system denies access; after max attempts, the session is locked.

### 7.2.6 UC-06: View AI Clinical Summary

| Field | Description |
|-------|-------------|
| Primary Actor | Doctor |
| Precondition | Valid session-scoped access exists |
| Postcondition | History and AI summary displayed |

**Main Success Flow**
1. System fetches and decrypts the patient's medical history.
2. System sends the history to the AI engine (Gemini).
3. AI returns a clinical summary with drug-interaction and allergy alerts.
4. System displays the history and AI summary to the doctor.

### 7.2.7 UC-07: Record Diagnosis & Prescription

| Field | Description |
|-------|-------------|
| Primary Actor | Doctor |
| Precondition | Doctor has reviewed history/AI summary |
| Postcondition | Verified encrypted record saved |

**Main Success Flow**
1. Doctor examines the patient and records symptoms.
2. Doctor writes a digital prescription and recommends tests/follow-up.
3. System encrypts the record (AES-256) and saves it as **Verified**.
4. System writes an audit-log entry and revokes access at session end.

### 7.2.8 UC-08: Upload Lab Report

| Field | Description |
|-------|-------------|
| Primary Actor | Diagnostic Lab |
| Precondition | Lab is approved; test was recommended |
| Postcondition | Verified report linked to patient |

**Main Success Flow**
1. Lab searches the patient and views prescribed tests.
2. Lab uploads a verified test report (PDF).
3. System encrypts and links the report to the patient/record.
4. System notifies the patient of the new report.

### 7.2.9 UC-09: View Personal Audit Log (Patient)

| Field | Description |
|-------|-------------|
| Primary Actor | Patient |
| Precondition | Patient is logged in |
| Postcondition | Access history displayed |

**Main Success Flow**
1. Patient opens the Audit Log.
2. System retrieves all access records for that patient.
3. System displays who accessed the data, what action, and when.

### 7.2.10 UC-10: Verify & Monitor (Admin)

| Field | Description |
|-------|-------------|
| Primary Actor | Admin |
| Precondition | Admin is logged in |
| Postcondition | Registrations processed; activity monitored |

**Main Success Flow**
1. Admin opens the monitoring/verification dashboard.
2. System displays pending doctor/lab registrations and system metrics.
3. Admin verifies/approves or rejects registrations.
4. Admin reviews the platform audit trail.
5. System logs all admin actions.

## 7.3 Entity Relationship Diagram (ERD)

> **Figure 2: Entity Relationship Diagram** — _Export from_ `diagrams/HealthNexus-ERD.drawio` _as PNG (Zoom 200%) and insert here._

## 7.4 Database Schema Definition

HealthNexus BD uses a normalized relational schema. A single `users` table holds identity/auth, with 1:1 role tables (`patients`, `doctors`, `diagnostic_labs`, `admins`). Clinical data, consent, AI output, and audit trails are modeled as related entities with 1:1, 1:N relationships.

### 7.4.1 Entity Summary Table

| Entity | Key Attributes | Other Attributes | Relationship |
|--------|----------------|------------------|--------------|
| users | id (PK) | email, phone, password_hash, role, status | Central identity for all users |
| patients | id (PK), user_id (FK) | uhid, nid, full_name, blood_group, allergies, chronic_diseases | users (1:1) patients |
| doctors | id (PK), user_id (FK) | bmdc_number, specialization, is_bmdc_verified, approved_at | users (1:1) doctors |
| diagnostic_labs | id (PK), user_id (FK) | license_number, center_name, is_approved | users (1:1) labs |
| admins | id (PK), user_id (FK) | full_name, admin_level | users (1:1) admins |
| medical_records | id (PK), patient_id (FK), doctor_id (FK) | content_encrypted, symptoms, diagnosis, is_verified, follow_up_date | patient (1) — (N) records |
| prescriptions | id (PK), record_id (FK) | medications, recommended_tests, notes | record (1) — (N) prescriptions |
| lab_reports | id (PK), patient_id (FK), lab_id (FK), record_id (FK) | test_name, file_ref_encrypted, is_verified | patient/lab (1) — (N) reports |
| access_sessions | id (PK), patient_id (FK), doctor_id (FK) | status, granted_at, expires_at | patient/doctor (1) — (N) sessions |
| otp_tokens | id (PK), patient_id (FK), session_id (FK) | code_hash, attempts, expires_at, is_used | session (1:1) otp |
| ai_summaries | id (PK), record_id (FK) | summary, interaction_alerts, allergy_alerts, model | record (1) — (N) summaries |
| audit_logs | id (PK), actor_user_id (FK), patient_id (FK) | action, resource, ip_address, created_at | users/patient (1) — (N) logs |

_(Full PostgreSQL DDL and Prisma schema are maintained in `HealthNexus-BD-Database.md` and `prisma/schema.prisma`.)_

## 7.5 Activity Diagram

> **Figure 3: Activity Diagram** — _Export from_ `diagrams/HealthNexus-Activity.drawio` _as PNG (Zoom 200%) and insert here._

---

# 8. Activity Diagram Description

The activity diagram illustrates the operational workflow of HealthNexus BD across five swimlanes: **Patient, System, Doctor, Diagnostic Lab, and System Admin**. Each subsection describes a major activity phase.

## 8.1 Patient Registration

| Step | Activity Description |
|------|----------------------|
| Register | Patient registers with NID and mobile number. |
| OTP Verify | System sends OTP; patient verifies to confirm identity. |
| Generate UHID | On valid OTP, system generates the unique Health ID (UHID). |
| Fill Profile | Patient fills basic health profile (blood group, allergies, diseases); saved to DB. |

## 8.2 Doctor Registration & Verification

| Step | Activity Description |
|------|----------------------|
| Register | Doctor registers with BMDC number and specialization. |
| BMDC Check | System verifies against the (mock) BMDC database. |
| Admin Approval | Admin reviews and approves the verified doctor. |
| Portal Access | On approval, doctor gains portal access. |

## 8.3 OTP Consent & Consultation

| Step | Activity Description |
|------|----------------------|
| Search Patient | Doctor searches the patient by UHID. |
| Request OTP | System sends OTP to the patient; patient shares it. |
| Verify OTP | On valid OTP, system grants a secure, session-scoped access. |
| AI Summary | System generates an AI clinical summary (Gemini). |
| Consult | Doctor reviews history + AI summary, examines patient, adds symptoms. |

## 8.4 Record & Encryption

| Step | Activity Description |
|------|----------------------|
| Prescribe | Doctor writes a digital prescription and recommends tests. |
| Encrypt & Save | System encrypts and saves the record (AES-256) as Verified. |
| Audit Log | System writes a security audit-log entry; patient is notified. |

## 8.5 Diagnostic Lab Workflow

| Step | Activity Description |
|------|----------------------|
| Register Lab | Diagnostic center registers; admin reviews and approves. |
| View Tests | Approved lab searches the patient and views prescribed tests. |
| Upload Report | Lab uploads verified test reports (PDF). |
| Link & Notify | System links the report to the patient profile and notifies them. |

## 8.6 Monitoring, Audit & Follow-up

| Step | Activity Description |
|------|----------------------|
| Patient Audit | Patient views a personal access log (who accessed data, when). |
| Admin Monitor | Admin monitors the system-wide audit trail. |
| Follow-up | If a future visit is needed, the consultation flow repeats. |

## 8.7 Key Architectural Characteristics

| Characteristic | Description |
|----------------|-------------|
| Consent-Driven Access | No clinical data is accessed without OTP-based patient consent. |
| Session-Scoped Authorization | Doctor access is time-boxed and auto-revoked. |
| Encryption at Rest | All records and lab files are AES-256 encrypted. |
| AI-Assisted, Human-Decided | AI summarizes and alerts; the doctor makes all decisions. |
| Immutable Audit Logging | Every access is recorded and patient-visible. |
| Verified vs Unverified Data | Doctor/lab entries are Verified; patient self-uploads are Unverified. |

## 8.8 Sequence Diagram

> **Figure 4: Sequence Diagram** — _Export from_ `diagrams/HealthNexus-Sequence.drawio` _as PNG (Zoom 200%) and insert here._

## 8.9 Sequence Scenario Description

| Step | Actor / System | Action Description |
|------|----------------|--------------------|
| 1 | Patient → System | Patient registers with NID & mobile. |
| 2 | System → Patient | System sends OTP challenge. |
| 3 | Patient → System | Patient submits OTP verification. |
| 4 | System → Patient | System generates UHID & access profile. |
| 5 | Patient → System | Patient fills basic health profile. |
| 6 | Doctor → System | Doctor registers with BMDC & specialty. |
| 7 | System → Admin | System requests admin approval/verification. |
| 8 | Admin → System | Admin approves doctor credentials. |
| 9 | System → Doctor | System grants portal access token. |
| 10 | Doctor → System | Doctor searches patient via UHID. |
| 11 | System → Patient | System triggers access request (sends OTP). |
| 12 | Patient → Doctor | Patient shares OTP verbally. |
| 13 | Doctor → System | Doctor inputs OTP for authentication. |
| 14 | System → System | System generates Gemini AI summary. |
| 15 | System → Doctor | System serves decrypted history & AI summary. |
| 16 | Doctor → System | Doctor records symptoms & writes prescription. |
| 17 | System → System | System encrypts records (AES-256). |
| 18 | System → Admin | System broadcasts security audit logs. |
| 19 | System → Patient | System sends real-time access notification. |
| **Diagnostic Lab Flow** | | |
| 20 | Lab → System | Lab registers center credentials. |
| 21 | System → Admin | System requests administration verification. |
| 22 | Admin → System | Admin validates & approves the lab. |
| 23 | Lab → System | Lab accesses prescribed patient tests. |
| 24 | Lab → System | Lab uploads diagnostic PDF reports. |
| 25 | System → Patient | System links reports & pushes updates. |
| **Monitoring & Follow-up** | | |
| 26 | Admin → System | Admin views dashboard audit logs. |
| 27 | Patient → System | Patient views personal access history. |
| 28 | Patient → System | Patient checks follow-up status. |
| 29 | System → Doctor | System re-initiates the consultation loop if needed. |

---

# 9. Future Enhancements

Future versions of HealthNexus BD may include:

- Mobile application (Android/iOS) for patients and doctors
- Real BMDC and NID API integration
- Biometric consent (fingerprint/face) as an alternative to OTP
- AI-based early-disease risk prediction from longitudinal history
- Telemedicine / video consultation module
- Insurance-claim and e-prescription pharmacy integration
- Offline-first support for low-connectivity rural areas

---

# 10. Team Member Responsibility Matrix

| Member Name | ID | Primary Responsibilities |
|-------------|-----|--------------------------|
| _[Member 1]_ | _[ID]_ | Backend API development, database schema (Prisma), authentication & OTP consent module |
| _[Member 2]_ | _[ID]_ | Frontend UI/UX (React), role-based dashboards, responsive layout, AI alert UI |
| _[Member 3]_ | _[ID]_ | AI/Gemini integration, encryption & audit module, testing and documentation |

---

_End of Software Requirements Specification — HealthNexus BD v1.0_
