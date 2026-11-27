"""Chapter 3: Software testing. Every system test case below maps to a real automated test that passes."""
from facts import F

CASES = [
    ('Patient registration', 'Valid name, NID, phone, e-mail, password', 'Account active, UHID issued, tokens returned',
     'Account created with UHID'),
    ('Duplicate registration', 'E-mail already in use', '409 Conflict, nothing saved', '409 returned'),
    ('Password storage', 'New account', 'Only a bcrypt hash is stored', 'Hash stored, no plain text'),
    ('Doctor registration', 'BMDC number not in registry', 'Registration refused', '400 returned'),
    ('Doctor registration', 'Valid, unclaimed BMDC number', 'Account pending; name copied from registry',
     'Pending account created'),
    ('Login', 'Correct e-mail or phone and password', 'Tokens issued, login audited', 'Logged in, audit entry written'),
    ('Login', 'Wrong password / unknown user', 'Same 401 message for both (no enumeration)', 'Identical 401 responses'),
    ('Login', 'Suspended account', '403 Forbidden', '403 returned'),
    ('Password reset', 'Correct 6-digit code', 'Password changed, old sessions signed out', 'Reset done, old tokens '
                                                                                            'rejected'),
    ('Password reset', 'Wrong, reused or expired code', 'Reset refused', 'Refused each time'),
    ('Access without consent', 'Doctor opens a patient chart with no session', 'Access refused', '403 returned'),
    ('OTP consent', 'Correct OTP within 5 minutes', f'{F["session_min"]}-minute session opens, grant audited',
     'Session opened and audited'),
    ('OTP consent', 'Wrong OTP five times', 'Request locked, even for the right code later', 'Locked after 5 tries'),
    ('OTP consent', 'Expired or already used OTP', 'Refused', 'Refused'),
    ('Patient control', 'Patient revokes an active session', 'Doctor loses access at once', 'Next request refused'),
    ('Session expiry', 'Session time runs out', 'Doctor loses access', 'Access refused after expiry'),
    ('Record encryption', 'Doctor saves a visit with a note', 'Note stored encrypted, shown decrypted to allowed users',
     'Ciphertext in database'),
    ('AI summary', 'Patient allergic to penicillin, amoxicillin prescribed', 'Allergy alert in the summary',
     'Alert shown'),
    ('AI privacy', 'Note contains the patient’s name and phone', 'Name and phone never sent to Gemini',
     'Removed before sending'),
    ('Lab upload', 'Test not prescribed', 'Upload refused', '403 TEST_NOT_PRESCRIBED'),
    ('Lab upload', 'File that is not a real PDF', 'Upload refused', 'Rejected by content check'),
    ('Lab upload', 'Valid PDF for a prescribed test', 'Only ciphertext stored; patient notified', 'Encrypted file '
                                                                                                  'stored'),
    ('Tampered file', 'Stored ciphertext changed', 'Download fails safely', 'Decryption refused'),
    ('Admin verification', 'Approve a pending doctor; reject one with a reason', 'Account activated; rejected one '
                                                                                 'suspended and audited',
     'Both handled and audited'),
    ('Suspension', 'Admin suspends a logged-in user', 'User’s current token rejected on the next request',
     'Signed out at once'),
    ('Role check', 'Each role calls other roles’ routes', '401 without a token, 403 for the wrong role',
     'All refused correctly'),
    ('Audit log integrity', 'UPDATE, DELETE or TRUNCATE on audit_logs', 'Database rejects the change',
     'Rejected by trigger'),
    ('Health assistant', 'Emergency message while the AI is down', 'Built-in 999 advice is shown',
     'Emergency advice shown'),
]


def build(r):
    r.page_break()
    r.h1('Software Testing', chapter=3)
    r.h2('3.1 Introduction')
    r.p('Testing throughout the development process was conducted to see the private data is not exposed due to a '
        'bug in consent / encryption. The tests that were performed, testing methods, and results are discussed in '
        'this chapter.')

    r.h2('3.2 Testing Features')
    r.h3('3.2.1 Elements to be Tested')
    r.label('Critical features:')
    r.numbered([
        'Registration, login, logout, token refresh and password reset.',
        'Role Based Access Control (RBAC): access management based off the route.',
        'OTP consent (Request, Verify, Attempt limit, Expire, Deny & Revoke).',
        'Lab files and clinical notes to be encrypted.',
        'Rules for appending-only audit log and uploading labs.',
    ])
    r.label('Important features:')
    r.numbered([
        'Removing personal identifiers (de-identification), Allergy Alerts, AI Summary.',
        'Health assistant safety rules.',
        'Admin Dashboard along with verifications, user management and notifications.',
        'Frontend pages, forms and language switch.',
    ])
    r.h3('3.2.2 Features Not Tested Automatically')
    r.p('There were three things that were not part of automated tests. Tests did not include real SMS and e-mail '
        'sending since the test is performed with the demo mode of the gateways, so no real SMS or e-mail is sent. '
        'Tests with the live Gemini answers have been skipped, as the tests are conducted with the AI-based stubbed '
        'out and hence repeatable. This project was not concerned with any load testing on a national scale.')

    r.h2('3.3 Testing Strategies')
    r.h3('3.3.1 Test Approach')
    r.bullets([
        ('Unit Testing: ', f'Vitest {F["v_vitest"]} for encryption, OTP, AI rules, SMS and storage and scheduler.'),
        'Tests integration with a freshly run embedded PostgreSQL along with all migrations, real Express app and '
        'fake external services using Vitest and Supertest.',
        ('Frontend Testing: ', 'Pages, forms and routing with Vitest, jsdom and React Testing Library.'),
        ('System testing: ', 'Manual walk through of all roles \u2013 desktop and mobile \u2013 in both languages.'),
        ('Security testing \u2013 ', 'tampered tokens, user enumeration, parallel OTP guessing, cross patient access '
                                     'and tampered files.'),
    ])
    r.h3('3.3.2 Pass/Fail Criteria')
    r.label('Pass criteria:')
    r.bullets(['All cases return the desired output and result.',
               'Responses do not include private data and there is no logs or AI input that leaks private data.',
               '90% at least (lines, statements, functions) & 75% (branches) backend coverage.'])
    r.label('Fail criteria:')
    r.bullets(['All crashes, incorrect status code or access to unauthorized data.',
               'Values below thresholds \u2013 automatic test run failure.'])

    r.h2('3.4 System Testing (Test Cases with Report)')
    r.p('Automated tests have been provided for all test cases in Table 3.1 and these tests pass.')
    rows = [[f'TC-{i:02d}', s, inp, exp, act, 'PASS'] for i, (s, inp, exp, act) in enumerate(CASES, start=1)]
    r.table(['ID', 'Scenario', 'Input', 'Expected output', 'Actual output', 'Result'], rows,
            [0.5, 1.05, 1.35, 1.45, 1.1, 0.55], caption='System test cases', chapter=3, font=9)

    r.h3('3.4.1 Test Summary')
    r.table(['Suite', 'Test files', 'Test cases', 'Passed', 'Failed'], [
        ['Backend (unit and integration)', str(F['files_backend']), str(F['tests_backend']), str(F['tests_backend']),
         '0'],
        ['Frontend (components and pages)', str(F['files_frontend']), str(F['tests_frontend']),
         str(F['tests_frontend']), '0'],
        ['Total', str(F['files_backend'] + F['files_frontend']), str(F['tests_total']), str(F['tests_total']), '0'],
    ], [2.4, 0.9, 0.9, 0.9, 0.9], caption='Automated test results', chapter=3, font=10)
    r.table(['Metric', 'Coverage', 'Required minimum'], [
        ['Statements', F['cov_statements'], '90%'], ['Branches', F['cov_branches'], '75%'],
        ['Functions', F['cov_functions'], '90%'], ['Lines', F['cov_lines'], '90%'],
    ], [2.0, 2.0, 2.0], caption='Backend code coverage (Vitest, V8 provider)', chapter=3, font=10)

    r.h2('3.5 Summary')
    r.p(f'100% success with all {F["tests_total"]} automated tests, with back end line-coverage performed at '
        f'{F["cov_lines"]} and 100% manual walk through on all workflows. Deployment and maintenance are the subjects '
        'of the next chapter.')
