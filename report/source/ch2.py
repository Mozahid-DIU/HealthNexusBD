"""Chapter 2, part 1: requirements and system design (UML and ER diagrams)."""
from facts import F, DIAGRAMS
import ch2_impl

FRS = [
    ('FR01', 'User registration', 'Patients register with name, NID, mobile, e-mail and password. Doctors register '
     'with a BMDC number and labs with a DGHS licence number; their names are taken from the registry.',
     'Patient, Doctor, Lab'),
    ('FR02', 'UHID generation', 'The system gives every new patient a unique, lifelong ID in the format BD-YYYY-NNNNN.',
     'System'),
    ('FR03', 'Login and logout', 'Users log in with e-mail or mobile number and password, and can log out from any '
     'device. Logout signs out all existing tokens.', 'All users'),
    ('FR04', 'Password reset', 'A user can reset a forgotten password with a 6-digit code sent by e-mail or SMS.',
     'All users'),
    ('FR05', 'Provider verification', 'The admin approves or rejects (with a reason) each doctor and lab after '
     'comparing the submitted data with the registry entry.', 'Admin'),
    ('FR06', 'Manage health profile', 'Patients update personal and health details such as blood group, allergies and '
     'chronic conditions.', 'Patient'),
    ('FR07', 'Search patient', 'Doctors and labs find a patient by UHID or mobile number and see only a minimal profile.',
     'Doctor, Lab'),
    ('FR08', 'Request access', 'A verified doctor asks for access with an optional reason; the system sends a 6-digit '
     f'OTP to the patient by SMS, valid for {F["otp_min"]} minutes.', 'Doctor'),
    ('FR09', 'Verify OTP', f'When the doctor enters the correct OTP (at most {F["otp_tries"]} tries), the system opens '
     f'a {F["session_min"]}-minute access session.', 'Doctor, System'),
    ('FR10', 'Deny or revoke access', 'The patient can deny a pending request or end an active session at any time.',
     'Patient'),
    ('FR11', 'View patient history', 'During a session the doctor sees the profile, past visits, prescriptions and lab '
     'reports.', 'Doctor'),
    ('FR12', 'Record visit and prescription', 'The doctor records symptoms, diagnosis, a clinical note, medicines, '
     'recommended tests and a follow-up date.', 'Doctor'),
    ('FR13', 'AI summary and alerts', 'The system produces a short clinical summary and warns about allergy and known '
     'drug-interaction risks.', 'Doctor, System'),
    ('FR14', 'Upload lab report', f'A verified lab uploads a PDF (up to {F["pdf_mb"]} MB) only for a test that a '
     'doctor has prescribed for that patient.', 'Lab'),
    ('FR15', 'View records and reports', 'Patients read their visits, prescriptions and lab reports and open the PDF '
     'files.', 'Patient'),
    ('FR16', 'Health assistant', 'Patients ask health questions in Bangla or English and get safe, simple answers '
     'about their own records and medicines.', 'Patient'),
    ('FR17', 'Notifications and reminders', 'Patients get in-app notices for access requests, granted access, new '
     'records and new lab reports, and a reminder the day before a follow-up.', 'Patient, System'),
    ('FR18', 'Access log', 'Patients see who viewed or changed their data, what they did and when.', 'Patient'),
    ('FR19', 'Dashboard and statistics', 'The admin sees platform counts and daily trends over 7, 30 or 90 days.',
     'Admin'),
    ('FR20', 'Suspend or reactivate users', 'The admin suspends or reactivates accounts; a suspended user is signed '
     'out at once.', 'Admin'),
    ('FR21', 'Platform audit log', 'The admin searches and filters the audit log of the whole platform.', 'Admin'),
    ('FR22', 'Language switch', 'Every screen is available in English and Bangla.', 'All users'),
]

NFRS = [
    ('Performance', ['The page-by-page lists are provided, key lookups happen through indexes and the pages are loaded '
                     'on-demand.',
                     'After 12 seconds AI timeout - plus a slow AI will never block the page.']),
    ('Reliability', ['In case of failure of Gemini, rule based summary and alerts.',
                     'Multi-step operations are performed as set of database transactions and a health check is '
                     'conducted every 5 minutes.']),
    ('Security', ['Passwords and codes are now bcrypt and clinical content is now AES-256-GCM and rate limits have been '
                  'added to sensitive routes.',
                  'All routes are validated by token, role and input and the audit log can only be added to.']),
    ('Usability', ['Easy-to-understand role dashboards that are optimized for mobile devices up to desktop, with two '
                   'different languages \u2014 Bangla and English!']),
    ('Portability', ['Uses only modern browser and provides all the settings through environment variables.']),
    ('Maintainability', ['The modules are structured into routes, controller, service and schema, using TypeScript '
                         'with tests.']),
]

USE_CASES = [
    ('UC-01: Register as a patient', [
        ('Use case', 'Register as a patient'),
        ('Goal', 'A new patient creates an account and receives a UHID.'),
        ('Preconditions', 'The person has a valid NID, a mobile number and an e-mail address that are not yet used.'),
        ('Success end condition', 'The account is active and the UHID is shown on the dashboard.'),
        ('Failed end condition', 'No account is created and the form shows what to fix.'),
        ('Primary actor', 'Patient'),
        ('Secondary actors', 'None'),
        ('Trigger', 'The patient clicks “Register” on the landing page.'),
        ('Main success scenario', ['1. The patient chooses the Patient tab.',
                                   '2. The patient enters name, NID, mobile, e-mail and password.',
                                   '3. The system validates the input.',
                                   '4. The system creates the account and generates the UHID.',
                                   '5. The system logs the patient in and opens the dashboard.']),
        ('Alternative flows', ['3a. Invalid or missing fields: the form highlights them and nothing is saved.',
                               '4a. NID, mobile or e-mail already used: the system shows a conflict message.']),
        ('Quality requirements', 'Registration takes less than two minutes on a phone.'),
    ]),
    ('UC-02: Request access with OTP consent', [
        ('Use case', 'Request access to a patient’s records'),
        ('Goal', 'A doctor gets time-limited access to a patient’s history with the patient’s consent.'),
        ('Preconditions', 'The doctor is verified and logged in; the patient is present and has their phone.'),
        ('Success end condition', f'A {F["session_min"]}-minute session is open, the patient is notified and the '
                                  'grant is in the audit log.'),
        ('Failed end condition', 'No session is opened and the doctor cannot see any clinical data.'),
        ('Primary actor', 'Doctor'),
        ('Secondary actors', 'Patient, SMS gateway'),
        ('Trigger', 'The doctor clicks “Send consent code” after finding the patient.'),
        ('Main success scenario', ['1. The doctor searches the patient by UHID or mobile number.',
                                   '2. The system shows a minimal profile with a masked phone number.',
                                   '3. The doctor requests access, optionally with a reason.',
                                   f'4. The system sends a 6-digit OTP by SMS, valid for {F["otp_min"]} minutes.',
                                   '5. The patient tells the doctor the OTP.',
                                   '6. The doctor enters the OTP and the system checks it.',
                                   '7. The system opens the session and shows the patient chart.']),
        ('Alternative flows', ['3a. The doctor already has access: the chart opens directly.',
                               '5a. The patient denies the request in the app: the code stops working.',
                               f'6a. Wrong code: the doctor may try again, up to {F["otp_tries"]} times.',
                               '6b. Code expired: the doctor must request a new code.']),
        ('Quality requirements', 'The SMS arrives within a minute; OTPs are stored only as hashes.'),
    ]),
    ('UC-03: Record a visit and prescription', [
        ('Use case', 'Record a visit and prescription'),
        ('Goal', 'The doctor saves the visit, prescription and tests in the patient’s record.'),
        ('Preconditions', 'The doctor has an active session for the patient.'),
        ('Success end condition', 'The record is encrypted and saved, the patient is notified and the action is '
                                  'audited.'),
        ('Failed end condition', 'Nothing is saved and the doctor sees an error.'),
        ('Primary actor', 'Doctor'),
        ('Secondary actors', 'Gemini AI'),
        ('Trigger', 'The doctor opens “New visit” on the patient chart.'),
        ('Main success scenario', ['1. The doctor enters symptoms, diagnosis and a clinical note.',
                                   '2. The doctor adds medicines, recommended tests and a follow-up date.',
                                   '3. The system checks the medicines against the patient’s allergies.',
                                   '4. The system encrypts the note and saves the record and prescription.',
                                   '5. The doctor generates an AI summary of the visit.']),
        ('Alternative flows', ['3a. Allergy conflict: the system shows a red alert and the doctor reviews the '
                               'prescription.',
                               '4a. The session has expired: the system refuses to save.',
                               '5a. The AI is unavailable: a rule-based summary is shown instead.']),
        ('Quality requirements', 'Saving takes a few seconds; the AI never changes what the doctor wrote.'),
    ]),
    ('UC-04: Upload a lab report', [
        ('Use case', 'Upload a lab report'),
        ('Goal', 'A lab delivers a test report to the patient’s record.'),
        ('Preconditions', 'The lab is verified and logged in; a doctor has prescribed the test.'),
        ('Success end condition', 'The encrypted PDF is stored, linked to the prescribing visit, and the patient is '
                                  'notified.'),
        ('Failed end condition', 'The file is rejected and nothing is stored.'),
        ('Primary actor', 'Lab'),
        ('Secondary actors', 'Cloudinary (file storage)'),
        ('Trigger', 'The lab clicks “Upload report” next to a prescribed test.'),
        ('Main success scenario', ['1. The lab searches the patient by UHID or mobile number.',
                                   '2. The system lists the tests prescribed for that patient.',
                                   '3. The lab picks a test and attaches the PDF.',
                                   '4. The system checks the file and the prescription.',
                                   '5. The system encrypts and stores the file and notifies the patient.']),
        ('Alternative flows', [f'4a. Not a PDF or larger than {F["pdf_mb"]} MB: the upload is refused.',
                               '4b. The test was not prescribed: the upload is refused.']),
        ('Quality requirements', 'Labs never see the patient’s clinical history.'),
    ]),
    ('UC-05: Verify a doctor or lab', [
        ('Use case', 'Verify a doctor or lab'),
        ('Goal', 'Only real, licensed providers can use the clinical features.'),
        ('Preconditions', 'The admin is logged in; there is a pending application.'),
        ('Success end condition', 'The account is active, or it is rejected with a recorded reason.'),
        ('Failed end condition', 'The application stays pending.'),
        ('Primary actor', 'Admin'),
        ('Secondary actors', 'Doctor or Lab (applicant)'),
        ('Trigger', 'The admin opens the Verifications page.'),
        ('Main success scenario', ['1. The system lists pending doctors and labs.',
                                   '2. The admin compares the submitted data with the registry entry.',
                                   '3. The admin clicks Approve.',
                                   '4. The system activates the account.']),
        ('Alternative flows', ['3a. The admin rejects the application and writes a reason; the account is suspended '
                               'and signed out.']),
        ('Quality requirements', 'Every decision is recorded in the audit log.'),
    ]),
]


def build(r):
    r.page_break()
    r.h1('Design and Implementation', chapter=2)
    r.h2('2.1 Introduction')
    r.p('This chapter explains all these and uses UML and an ER diagram to model the system, then covers the '
        'architecture and describes the implementation including sample code.')

    r.h2('2.2 Functional Requirements')
    r.p('Table 2.1 shows the 22 functional requirements, and the users that each requirement supports.')
    r.table(['ID', 'Requirement', 'Description', 'Stakeholder'], [list(x) for x in FRS], [0.55, 1.35, 3.0, 1.1],
            caption='Functional requirements', chapter=2, font=10)

    r.h2('2.3 Non-Functional Requirements')
    for i, (name, items) in enumerate(NFRS, start=1):
        r.h3(f'2.3.{i} {name}')
        r.bullets(items)

    r.h2('2.4 System Design')
    r.h3('2.4.1 Use Case Diagram')
    fig = r.next_figure(2)
    r.p(f'{fig} shows the four actors and their uses. The patient is registered when a UHID is created and allergy '
        'check is part of the procedure of writing a prescription.')
    r.figure(DIAGRAMS / 'UseCase Diagram v3.png', 'Use case diagram', 2, max_h_in=9.0, rotate=True)

    r.h3('2.4.2 Use Case Descriptions')
    for title, rows in USE_CASES:
        r.kv_table(rows, caption=title, chapter=2)

    r.h3('2.4.3 Activity Diagrams')
    for role, text in [('Patient', 'Patient activity: registration, login and the main patient tasks'),
                       ('Doctor', 'Doctor activity: verification, OTP consent, visit and AI summary'),
                       ('Lab', 'Lab activity: verification and report upload'),
                       ('Admin', 'Admin activity: verification and user management')]:
        r.figure(DIAGRAMS / f'Activity Diagram v3 - {role}.png', text, 2, width_in=6.0,
                 max_h_in=9.0 if role in ('Doctor', 'Patient') else 7.6, rotate=(role == 'Patient'))

    r.h3('2.4.4 Sequence Diagrams')
    for name, text in [('1 Login', 'Login'), ('2 Doctor Approval', 'Doctor registration and approval'),
                       ('3 OTP Consent', 'OTP consent'), ('4 Visit and AI Summary', 'Visit and AI summary'),
                       ('5 Lab Upload', 'Lab report upload')]:
        r.figure(DIAGRAMS / f'Sequence Diagram v3 - {name}.png', f'Sequence diagram: {text}', 2)

    r.h3('2.4.5 ER Diagram')
    fig = r.next_figure(2)
    r.p(f'The Prisma schema is shown as a database with 16 tables, 121 columns and 20 foreign keys as shown in '
        f'{fig}.')
    r.figure(DIAGRAMS / 'ER Diagram v3.png', 'Entity relationship diagram', 2, max_h_in=9.0, rotate=True)
    r.table(['Table', 'Purpose'], [
        ['users', 'Login identity, role, status and token version for every account'],
        ['patients / doctors / diagnostic_labs / admins', 'Role profiles, one-to-one with users'],
        ['doctor_registry / lab_registry', 'Simulated BMDC [15] and DGHS [16] registries used for verification'],
        ['password_reset_tokens', 'Hashed password-reset codes with expiry and attempts'],
        ['medical_records', 'Visits: symptoms, diagnosis, encrypted note, follow-up date'],
        ['prescriptions', 'Medicines and recommended tests for a visit'],
        ['lab_reports', 'Uploaded reports with the encrypted file reference'],
        ['access_sessions', 'Time-limited consent sessions (active, expired, revoked)'],
        ['otp_tokens', 'Hashed consent OTPs, attempts and expiry'],
        ['ai_summaries', 'AI summaries and alerts per visit, with the model used'],
        ['notifications', 'In-app notices for patients'],
        ['audit_logs', 'Append-only record of every important action'],
    ], [2.4, 3.6], caption='Database tables', chapter=2, font=10)

    ch2_impl.build(r)
