"""The five HealthNexus BD sequence diagrams."""
import sys
from pathlib import Path

from sequence import Seq

OUT = Path(sys.argv[1])

# (fill, stroke) per participant type
USER = {'patient': '#dae8fc', 'doctor': '#ffe6cc', 'lab': '#e1d5e7', 'admin': '#f8cecc', 'any': '#f2f2f2'}
WEB = ('web', 'Web App\n(React)', 'box', '#e8f1fb', '#6c8ebf')
API = ('api', 'Backend API\n(Express)', 'box', '#eaf6ea', '#5a9a5a')
DB = ('db', 'Database\n(PostgreSQL)', 'box', '#fff6dc', '#c9a227')


def login():
    s = Seq('Sequence Diagram 1 — Log In (any user)',
            [('user', 'User', 'actor', USER['any'], '#111'), WEB, API, DB])
    m, r, me, alt = s.msg, s.ret, s.selfc, s.alt
    s.add(
        m('user', 'web', 'Enter email / phone and password'),
        m('web', 'api', 'POST /auth/login'),
        me('api', 'Rate limit & validate input'),
        m('api', 'db', 'Find user by email or phone'),
        r('db', 'api', 'User (password hash, role, status)'),
        me('api', 'Compare password with bcrypt hash'),
        alt([
            ('wrong password or suspended', [
                r('api', 'web', '401 Invalid credentials / 403 Suspended'),
                r('web', 'user', 'Show the error'),
            ]),
            ('credentials valid', [
                me('api', 'Sign JWT access (15 min) & refresh (7 days)'),
                m('api', 'db', 'Write audit log (login)'),
                r('api', 'web', '200 user profile + tokens'),
                r('web', 'user', 'Open the role dashboard'),
            ]),
        ]),
    )
    return s


def approval():
    s = Seq('Sequence Diagram 2 — Doctor Registration & Admin Approval',
            [('doctor', 'Doctor', 'actor', USER['doctor'], '#111'), WEB, API, DB,
             ('admin', 'Admin', 'actor', USER['admin'], '#111')])
    m, r, me, alt = s.msg, s.ret, s.selfc, s.alt
    s.add(
        m('doctor', 'web', 'Register (BMDC no., email, phone, password)'),
        m('web', 'api', 'POST /auth/register'),
        m('api', 'db', 'Look up the BMDC number in the registry'),
        r('db', 'api', 'Registry entry (name, specialization)'),
        alt([
            ('not in registry or already claimed', [
                r('api', 'web', '400 / 409 error'),
                r('web', 'doctor', 'Show the error'),
            ]),
            ('valid number', [
                m('api', 'db', 'Create user (status: pending) & claim the number'),
                r('api', 'web', '201 account created'),
                r('web', 'doctor', 'Show "waiting for verification"'),
            ]),
        ]),
        m('admin', 'web', 'Open Verifications'),
        m('web', 'api', 'GET /admin/doctors?status=pending'),
        m('api', 'db', 'Pending doctors + registry entries'),
        r('db', 'api', 'Applications'),
        r('api', 'web', 'Application beside its registry entry'),
        alt([
            ('admin approves', [
                m('admin', 'web', 'Approve'),
                m('web', 'api', 'POST /admin/doctors/:id/approve'),
                m('api', 'db', 'Mark verified, status: active; audit log'),
                r('api', 'web', 'Approved (doctor can now log in)'),
            ]),
            ('admin rejects with a reason', [
                m('admin', 'web', 'Reject with a reason'),
                m('web', 'api', 'POST /admin/doctors/:id/reject'),
                m('api', 'db', 'Suspend & sign out; audit log with reason'),
                r('api', 'web', 'Rejected'),
            ]),
        ]),
    )
    return s


def consent():
    s = Seq('Sequence Diagram 3 — OTP Consent: Doctor Opens a Patient Record',
            [('doctor', 'Doctor', 'actor', USER['doctor'], '#111'), WEB, API, DB,
             ('sms', 'SMS Gateway\n(BulkSMSBD)', 'box', '#f2f2f2', '#777'),
             ('patient', 'Patient', 'actor', USER['patient'], '#111')])
    m, r, me, alt = s.msg, s.ret, s.selfc, s.alt
    s.add(
        m('doctor', 'web', 'Search patient (UHID / mobile)'),
        m('web', 'api', 'GET /doctor/search'),
        m('api', 'db', 'Find patient'),
        r('db', 'api', 'Patient'),
        r('api', 'web', 'Minimal profile (no clinical data)'),
        m('doctor', 'web', 'Request access with a reason'),
        m('web', 'api', 'POST /consent/request'),
        me('api', 'Generate 6-digit OTP & hash it (bcrypt)'),
        m('api', 'db', 'Save hashed OTP (expires in 5 min)'),
        m('api', 'sms', "Send the code to the patient's phone"),
        r('sms', 'patient', 'SMS with the code'),
        m('api', 'db', 'In-app notification + audit log'),
        r('api', 'web', '201 request created'),
        r('patient', 'doctor', 'Tells the code (if they agree)'),
        m('doctor', 'web', 'Enter the code'),
        m('web', 'api', 'POST /consent/verify'),
        m('api', 'db', 'Use up one attempt (max 5)'),
        me('api', 'Compare code with hash, check expiry'),
        alt([
            ('wrong or expired', [
                r('api', 'web', '400 attempts left / 429 locked'),
            ]),
            ('code correct', [
                m('api', 'db', 'Open 30-min session, audit, notify patient'),
                r('api', 'web', '201 session'),
                m('web', 'api', 'GET /doctor/patients/:id/records'),
                m('api', 'db', 'Records (AES-256 encrypted)'),
                r('db', 'api', 'Encrypted records'),
                me('api', 'Decrypt; write audit log (view)'),
                r('api', 'web', 'History, prescriptions, allergies'),
                r('web', 'doctor', 'Patient chart'),
            ]),
        ]),
    )
    return s


def visit():
    s = Seq('Sequence Diagram 4 — Record a Visit & Generate the AI Clinical Summary',
            [('doctor', 'Doctor', 'actor', USER['doctor'], '#111'), WEB, API, DB,
             ('ai', 'Gemini AI', 'box', '#f2f2f2', '#777')])
    m, r, me, alt = s.msg, s.ret, s.selfc, s.alt
    s.add(
        m('doctor', 'web', 'Diagnosis, note, medicines, tests'),
        m('web', 'api', 'POST /doctor/records'),
        m('api', 'db', 'Check the consent session is active'),
        me('api', 'Encrypt the clinical note (AES-256)'),
        m('api', 'db', 'Save record; audit log; notify patient'),
        r('api', 'web', '201 record'),
        m('web', 'api', 'POST /doctor/records/:id/prescription'),
        m('api', 'db', 'Save prescription; audit log'),
        r('api', 'web', '201 prescription'),
        m('doctor', 'web', 'Generate AI summary'),
        m('web', 'api', 'POST /doctor/records/:id/ai-summary'),
        m('api', 'db', 'Record, prescription, allergies, conditions'),
        r('db', 'api', 'Data'),
        me('api', 'Decrypt & de-identify (remove name, IDs, phone)'),
        m('api', 'ai', 'Summarise (no identity sent)'),
        alt([
            ('Gemini answers', [
                r('ai', 'api', 'Summary (JSON)'),
            ]),
            ('Gemini busy or times out', [
                me('api', 'Use the rule-based summary'),
            ]),
        ]),
        me('api', 'Add rule-based allergy & interaction alerts\n+ reviewed side effects'),
        m('api', 'db', 'Save AI summary; audit log'),
        r('api', 'web', 'Summary, alerts, side effects'),
        r('web', 'doctor', 'Red allergy / interaction alerts'),
    )
    return s


def upload():
    s = Seq('Sequence Diagram 5 — Lab Uploads an Encrypted Report',
            [('lab', 'Diagnostic Lab', 'actor', USER['lab'], '#111'), WEB, API, DB,
             ('cloud', 'Cloud Storage\n(Cloudinary)', 'box', '#f2f2f2', '#777')])
    m, r, me, alt = s.msg, s.ret, s.selfc, s.alt
    s.add(
        m('lab', 'web', 'Search patient (UHID / mobile)'),
        m('web', 'api', 'GET /lab/search'),
        m('api', 'db', 'Patient + prescribed tests'),
        r('db', 'api', 'Tests'),
        r('api', 'web', 'Prescribed tests (pending first)'),
        m('lab', 'web', 'Choose a test, attach the PDF'),
        me('web', 'Check PDF signature & size'),
        m('web', 'api', 'POST /lab/reports (file)'),
        me('api', 'Verify real PDF, at most 10 MB'),
        m('api', 'db', 'Latest prescriptions of this patient'),
        r('db', 'api', 'Prescribed tests'),
        alt([
            ('test not prescribed', [
                r('api', 'web', '403 TEST_NOT_PRESCRIBED'),
            ]),
            ('test prescribed', [
                me('api', 'Encrypt the PDF (AES-256)'),
                m('api', 'cloud', 'Upload the encrypted file'),
                r('cloud', 'api', 'File reference'),
                m('api', 'db', 'Save report (encrypted reference); audit log'),
                m('api', 'db', 'Notify the patient (in-app)'),
                r('api', 'web', '201 report uploaded'),
                r('web', 'lab', 'Upload confirmed'),
            ]),
        ]),
    )
    return s


OUT.mkdir(parents=True, exist_ok=True)
for i, (name, build) in enumerate([('login', login), ('approval', approval), ('consent', consent),
                                   ('visit', visit), ('upload', upload)], start=1):
    sq = build()
    (OUT / f'sequence-{i}-{name}.svg').write_text(sq.svg(), encoding='utf-8')
    (OUT / f'HealthNexus-Sequence-{i}-{name}.drawio').write_text(sq.drawio(f'sequence-{name}'), encoding='utf-8')
    print(f'{i} {name}: {len(sq.parts)} participants')
