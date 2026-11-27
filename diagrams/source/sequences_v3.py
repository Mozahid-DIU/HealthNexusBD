"""The five HealthNexus BD sequence diagrams in plain draw.io style (short labels, large text).

Usage: python sequences_v3.py OUT_DIR   (then render each .drawio with drawio-render.mjs)
"""
import sys
from pathlib import Path

from sequence_v3 import Seq

OUT = Path(sys.argv[1])
WEB = ('web', 'Web App', 'box')
API = ('api', 'Server', 'box')
DB = ('db', 'Database', 'box')


def login():
    s = Seq('Login', [('user', 'User', 'actor'), WEB, API, DB])
    m, r, me, alt = s.msg, s.ret, s.selfc, s.alt
    s.add(
        m('user', 'web', 'Enter ID & password'),
        m('web', 'api', 'POST /auth/login'),
        m('api', 'db', 'Find user'),
        r('db', 'api', 'User data'),
        me('api', 'Check password'),
        alt([
            ('wrong or suspended', [
                r('api', 'web', '401 / 403 error'),
                r('web', 'user', 'Show error'),
            ]),
            ('valid', [
                me('api', 'Create tokens'),
                m('api', 'db', 'Save audit log'),
                r('api', 'web', '200 OK + tokens'),
                r('web', 'user', 'Open dashboard'),
            ]),
        ]),
    )
    return s


def approval():
    s = Seq('Doctor Approval', [('doctor', 'Doctor', 'actor'), WEB, API, DB, ('admin', 'Admin', 'actor')])
    m, r, me, alt = s.msg, s.ret, s.selfc, s.alt
    s.add(
        m('doctor', 'web', 'Register with BMDC no.'),
        m('web', 'api', 'POST /auth/register'),
        m('api', 'db', 'Find BMDC number'),
        r('db', 'api', 'Registry entry'),
        alt([
            ('not found or used', [
                r('api', 'web', '400 / 409 error'),
                r('web', 'doctor', 'Show error'),
            ]),
            ('valid', [
                m('api', 'db', 'Save user (pending)'),
                r('api', 'web', '201 Created'),
                r('web', 'doctor', 'Wait for approval'),
            ]),
        ]),
        m('admin', 'web', 'Open verifications'),
        m('web', 'api', 'GET pending doctors'),
        m('api', 'db', 'Find pending doctors'),
        r('db', 'api', 'Applications'),
        r('api', 'web', 'Application list'),
        r('web', 'admin', 'Show applications'),
        alt([
            ('approve', [
                m('admin', 'web', 'Approve'),
                m('web', 'api', 'POST /approve'),
                m('api', 'db', 'Set status active'),
                r('api', 'web', 'Approved'),
            ]),
            ('reject', [
                m('admin', 'web', 'Reject with reason'),
                m('web', 'api', 'POST /reject'),
                m('api', 'db', 'Suspend, save reason'),
                r('api', 'web', 'Rejected'),
            ]),
        ]),
    )
    return s


def consent():
    s = Seq('OTP Consent', [('doctor', 'Doctor', 'actor'), WEB, API, DB, ('sms', 'SMS Gateway', 'box'),
                            ('patient', 'Patient', 'actor')])
    m, r, me, alt = s.msg, s.ret, s.selfc, s.alt
    s.add(
        m('doctor', 'web', 'Request access'),
        m('web', 'api', 'POST /consent/request'),
        me('api', 'Create & hash OTP'),
        m('api', 'db', 'Save OTP (5 min)'),
        m('api', 'sms', 'Send OTP'),
        r('sms', 'patient', 'SMS with OTP'),
        r('api', 'web', '201 Request sent'),
        r('patient', 'doctor', 'Tells the OTP'),
        m('doctor', 'web', 'Enter OTP'),
        m('web', 'api', 'POST /consent/verify'),
        m('api', 'db', 'Count try (max 5)'),
        me('api', 'Check OTP & expiry'),
        alt([
            ('wrong or expired', [
                r('api', 'web', '400 Try again'),
                r('web', 'doctor', 'Show error'),
            ]),
            ('correct', [
                m('api', 'db', 'Open 30 min session'),
                m('api', 'db', 'Notify patient, audit'),
                r('api', 'web', '201 Session'),
                r('web', 'doctor', 'Show patient chart'),
            ]),
        ]),
    )
    return s


def visit():
    s = Seq('Visit and AI Summary', [('doctor', 'Doctor', 'actor'), WEB, API, DB, ('ai', 'Gemini AI', 'box')])
    m, r, me, alt = s.msg, s.ret, s.selfc, s.alt
    s.add(
        m('doctor', 'web', 'Save visit & medicines'),
        m('web', 'api', 'POST /records'),
        m('api', 'db', 'Check session'),
        me('api', 'Encrypt note'),
        m('api', 'db', 'Save visit, prescription'),
        r('api', 'web', '201 Created'),
        m('doctor', 'web', 'Generate AI summary'),
        m('web', 'api', 'POST /ai-summary'),
        m('api', 'db', 'Get record & allergies'),
        r('db', 'api', 'Data'),
        me('api', 'Remove identity'),
        m('api', 'ai', 'Summarise'),
        alt([
            ('Gemini replies', [
                r('ai', 'api', 'Summary'),
            ]),
            ('busy or timeout', [
                me('api', 'Rule-based summary'),
            ]),
        ]),
        me('api', 'Check allergies'),
        m('api', 'db', 'Save summary'),
        r('api', 'web', 'Summary + alerts'),
        r('web', 'doctor', 'Show alerts'),
    )
    return s


def upload():
    s = Seq('Lab Upload', [('lab', 'Lab', 'actor'), WEB, API, DB, ('cloud', 'Cloud Storage', 'box')])
    m, r, me, alt = s.msg, s.ret, s.selfc, s.alt
    s.add(
        m('lab', 'web', 'Search patient'),
        m('web', 'api', 'GET /lab/search'),
        m('api', 'db', 'Find prescribed tests'),
        r('db', 'api', 'Tests'),
        r('api', 'web', 'Test list'),
        m('lab', 'web', 'Pick test, attach PDF'),
        m('web', 'api', 'POST /lab/reports'),
        me('api', 'Check PDF & size'),
        m('api', 'db', 'Is test prescribed?'),
        r('db', 'api', 'Result'),
        alt([
            ('not prescribed', [
                r('api', 'web', '403 Not prescribed'),
            ]),
            ('prescribed', [
                me('api', 'Encrypt PDF'),
                m('api', 'cloud', 'Upload file'),
                r('cloud', 'api', 'File link'),
                m('api', 'db', 'Save report, notify'),
                r('api', 'web', '201 Uploaded'),
                r('web', 'lab', 'Show success'),
            ]),
        ]),
    )
    return s


OUT.mkdir(parents=True, exist_ok=True)
for i, (name, build) in enumerate([('Login', login), ('Doctor Approval', approval), ('OTP Consent', consent),
                                   ('Visit and AI Summary', visit), ('Lab Upload', upload)], start=1):
    sq = build()
    (OUT / f'Sequence-{i}.drawio').write_text(sq.drawio(), encoding='utf-8')
    problems = sq.check()
    print(f'{i} {name}: {sq.width()}x{sq.layout()[1]}, {len(problems)} problems', *[f'\n   {p}' for p in problems])
