"""Chapter 5: User manual with screenshots of the live system."""
from facts import SHOTS

PAGES = [
    ('Common pages', [
        ('01-landing', 'Landing page', 'The landing page explains the system and links to registration and login. '
                                       'The EN/BN button at the top switches the language.'),
        ('02-login', 'Login page', 'Users log in with their e-mail address or mobile number and password.'),
        ('03-register-doctor', 'Registration page (doctor tab)', 'The Patient, Doctor and Lab tabs show the fields each '
                                                                 'role needs. Doctors enter their BMDC number.'),
        ('04-forgot-password', 'Password reset page', 'A 6-digit code is sent by e-mail or SMS to reset a forgotten '
                                                       'password.'),
    ]),
    ('Patient', [
        ('05-patient-dashboard', 'Patient dashboard', 'The dashboard shows the UHID card, counts of records, reports '
                                                      'and requests, and the most recent visits.'),
        ('06-patient-records', 'Medical records', 'All visits are listed with diagnosis, doctor and date.'),
        ('07-patient-record-detail', 'Record detail', 'A visit shows the clinical note, the prescription and the '
                                                      'recommended tests.'),
        ('08-patient-lab-reports', 'Lab reports', 'Reports uploaded by labs can be viewed or downloaded as PDF.'),
        ('09-patient-consent-center', 'Consent center', 'Pending requests can be denied and active doctor access can '
                                                        'be revoked here.'),
        ('10-patient-audit-log', 'Who accessed my data', 'Every view or change of the patient’s data, with the '
                                                         'person and time.'),
        ('11-patient-notifications', 'Notifications', 'Notices about access requests, granted access, new records '
                                                      'and new reports.'),
        ('12-patient-profile', 'My profile', 'Personal and health information, such as blood group and allergies.'),
        ('13-assistant-consent', 'Health assistant: consent notice', 'The patient reads and accepts the rules before '
                                                                     'the first chat.'),
        ('14-assistant-chat', 'Health assistant: chat in Bangla', 'The assistant answers questions about the '
                                                                  'patient’s own records in simple language.'),
    ]),
    ('Doctor', [
        ('15-doctor-home', 'Doctor dashboard', 'The doctor’s home page with patient search and current access.'),
        ('16-doctor-find-patient', 'Find a patient', 'After a search, the doctor sees a minimal profile with a masked '
                                                     'phone number and sends the consent code.'),
        ('17-doctor-consent-otp', 'Enter the consent code (demo mode)', 'The doctor types the 6-digit code the patient '
                                                                         'reads out. In demo mode the code is shown on '
                                                                         'screen instead of being sent by SMS.'),
        ('18-doctor-patient-chart', 'Patient chart with AI overview', 'The chart shows allergies, conditions, the AI '
                                                                      'overview and past visits.'),
        ('19-doctor-new-visit', 'New visit and prescription', 'The doctor records the visit, medicines and tests, and '
                                                              'sees allergy alerts.'),
        ('20-doctor-my-patients', 'My patients', 'Patients the doctor currently has access to, with the time left.'),
    ]),
    ('Lab', [
        ('21-lab-home', 'Lab dashboard', 'The lab’s home page with patient search and recent uploads.'),
        ('22-lab-prescribed-tests', 'Prescribed tests and upload', 'Only the tests a doctor has prescribed are shown, '
                                                                   'each with an Upload report button.'),
        ('23-lab-upload-history', 'Upload history', 'All reports uploaded by the lab.'),
    ]),
    ('Admin', [
        ('24-admin-login', 'Admin login', 'Administrators use a separate login page.'),
        ('25-admin-dashboard', 'Admin dashboard', 'Platform counts and daily trends for 7, 30 or 90 days.'),
        ('26-admin-verifications', 'Verifications', 'The submitted data is shown next to the registry entry so the '
                                                    'admin can approve or reject.'),
        ('27-admin-users', 'User management', 'Users can be filtered by role and status, and suspended or reactivated.'),
        ('28-admin-audit-log', 'Platform audit log', 'All actions on the platform, searchable and filterable.'),
    ]),
    ('Mobile view in Bangla', [
        ('29-mobile-bangla-dashboard', 'Patient dashboard on a phone (Bangla)', ''),
        ('30-mobile-bangla-lab-reports', 'Lab reports on a phone (Bangla)', ''),
    ]),
]

STEPS = [
    ('5.2.1 Registration and Login', [
        'Click Register, select Patient, Doctor or Lab and fill out the form (Enter BMDC number or DGHS licence for '
        'providers).',
        'Doctors/labs would wait for approval by the admin and UHIDs would be given to the patient immediately.',
        'Log in with e-mail or mobile number; reset with a 6 digit code by using \u201cForgot password?\u201d.',
    ]),
    ('5.2.2 Patient Tasks', [
        'Read Records & Lab Reports; update Allergies and other information in My profile.',
        'If you don\u2019t agree: Deny access to SMS code in Consent center.',
        'Who has been accessing my data? Check on each of them and ask the Health Assistant in Bangla / English.',
    ]),
    ('5.2.3 Doctor Tasks', [
        'Search for the patient on UHID and/or mobile and send a consent code to them.',
        'Type in the code that the patient reads and press Verify and open chart.',
        'Read AI overview, visit and prescription added and read allergy alert. After 30 minutes access will be '
        'terminated.',
    ]),
    ('5.2.4 Lab Tasks', [
        'Search patient and select a test prescribed, upload the pdf (max size 10MB).',
        'See your earlier uploads on Upload history.',
    ]),
    ('5.2.5 Admin Tasks', [
        'Login in the admin login page and see the Dashboard.',
        'Review doctors, labs and approve/reject in the Verifications; suspend/activate a user\u2019s access; see the '
        'Audit log.',
    ]),
]


def build(r):
    r.page_break()
    r.h1('User Manual', chapter=5)
    r.h2('5.1 Introduction')
    r.p('This chapter is a short description for each of the roles along with screenshots of the application live. '
        'All screens are supported by English, Bangla & mobile.')

    r.h2('5.2 Project Functionalities')
    for title, steps in STEPS:
        r.h3(title)
        r.numbered(steps)

    r.h2('5.3 Screens of the System')
    for group, pages in PAGES:
        r.label(group)
        if group.startswith('Mobile'):
            r.figure_pair([(SHOTS / f'{f}.png', c) for f, c, _ in pages], 5)
            continue
        for file, caption, _ in pages:
            r.figure(SHOTS / f'{file}.png', caption, 5, width_in=6.0, max_h_in=7.8)

    r.h2('5.4 Summary')
    r.p('Throughout this chapter, all the roles were shown using the system, via examples of screenshots. Very simple '
        'interface, with English & Bangla support \u2013 little training required.')
