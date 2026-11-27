"""Chapter 1: Introduction (background, feasibility, users, block diagram, requirements, schedule)."""
from facts import F, DIAGRAMS


def build(r):
    r.h1('Introduction', chapter=1)
    r.h2('1.1 Background')
    r.h3('1.1.1 Context and Relevance')
    r.p('In Bangladesh with most of the records on paper there is no common register directory system between the '
        'hospital, clinic, diagnostic centre and private chamber in managing the records. It\u2019s the patient who '
        'makes the connections; they need to bring all their prescriptions with them and talk to any new physicians. '
        'GSM mobiles are carried by nearly all adults and a web-based record \u2013 in addition to being possible '
        '\u2013 is useful and something the patient should have control over; and, from the point of view of patient '
        'care, WHO recommend that a record should travel with the patient from provider to provider [1].')
    r.p('HealthNexus BD is a one-stop solution that enables a patient, physician, diagnostic laboratory and the '
        'administrator to be connected. Every patient gets his/her Unified Health ID (UHID), for ever and no doctor '
        'can access a patient\u2019s record without his/her consent.')

    r.h3('1.1.2 Problem Identification')
    r.p('The existing mechanisms to manage patient information result in the following issues:')
    r.numbered([
        'Notes, visits, prescriptions and reports are lost in the shuffle and no one doctor has a complete picture '
        'of the patient making decisions based on partial information.',
        ('Unknown allergies and medicines: ', 'The new doctor may think that a patient is not allergic to a medicine, '
                                              'or the patient may be on another medicine which the new doctor may not '
                                              'know about, and this could lead to an unsafe prescription.'),
        ('Redo-testing: ', 'If the patient forgets to bring an old test report home to the clinic or if there is a '
                           'test report that is lost, it may be repeated, costing patients time and money.'),
        ('No patient control: ', 'Patient can\u2019t choose who opens up their digital file, if there is one, let '
                                 'alone does the patient know if there is a one, and patient is not even aware of '
                                 'others who have opened and read that file.'),
        ('Unverified provider \u2013 ', 'there is no easy way of ensuring verification that the reader or writer of '
                                        'a record is a registered doctor or a licensed lab.'),
        ('Limited amount of time in the chamber \u2013 ', 'doctor only has a few minutes to spend per patient, cannot '
                                                          'spend too much time reading through a thick folder, must '
                                                          'be concise but informative.'),
    ])

    r.h3('1.1.3 Purpose and Justification')
    r.p('The project will work to:')
    r.bullets([
        'Provide each patient with a lifetime UHID (BD-YYYY-NNNNN) with secure history;',
        'Make sure that the system verifies the doctor with his BMDC number and the lab with its licence from DGHS '
        'before proceeding with anything;',
        'Provide access to doctors only for a limited period of time and on the basis of an SMS (one-time password) '
        'OTP that patients can give to their doctors;',
        'encrypt patient data and log all access to it in a patient-readable log;',
        'summarise the history and alert about allergies with the use of artificial intelligence, but don\u2019t '
        'make decisions;',
        'Work on cheap mobile phones in Bangla & English as well.',
    ])

    r.h3('1.1.4 Scope')
    r.label('Included in scope:')
    r.bullets([
        '4 Roles \u2013 Patient, Doctor, Diagnostic Lab and Admin.',
        'UHID creation, Provider verification & Search of Patient on UHID/mobile.',
        'Consent sessions (deny/revoke) about OTP.',
        'Visit records, prescriptions, lab report (PDF) upload and AI visit feature using a rule based fallback.',
        'Encryption, audit log, notifications, reminders and an admin dashboard.',
        'Responsive Web Interface in two languages (bangla and english).',
    ])
    r.label('Excluded from scope:')
    r.bullets([
        'Native mobile app, video consultation, payment and insurance.',
        'A live connection with the official BMDC, DGHS or NID databases (seeding the database tables is done '
        'instead).',
        'AI Powered Autodiagnosis or AI Powered treatment.',
    ])

    r.h2('1.2 Feasibility Study')
    r.h3('1.2.1 Technical Feasibility')
    r.label('Assessment: Highly feasible')
    r.p(f'We are using all the mature and free tools such as React {F["v_react"]}, Node.js and Express '
        f'{F["v_express"]}, PostgreSQL (Neon) with Prisma {F["v_prisma"]}, the Gemini API, BulkSMSBD and Gmail SMTP '
        'along with Cloudinary. Through courses the developer gained knowledge of JavaScript, React and SQL.')
    r.h3('1.2.2 Operational Feasibility')
    r.label('Assessment: Feasible')
    r.p('Only actions in the user\u2019s browser are performed. Access is approved by a normal SMS sent to the patient '
        '(no need of the fancy cell phone) and each role will only have specific tasks.')
    r.h3('1.2.3 Economic Feasibility')
    r.label('Assessment: Highly feasible')
    r.p('Free hosting, database, storage and AI. Running cost is SMS, which costs less than one taka per SMS, and no '
        'licence fees involved.')
    r.h3('1.2.4 Schedule Feasibility')
    r.label('Assessment: Feasible')
    r.p('The work was done within approximately five months starting from the proposal in June 2026 to the end of '
        'November 2026 when submitted (Section 1.6).')
    r.h3('1.2.5 Legal Feasibility')
    r.label('Assessment: Feasible')
    r.p('Only demo data is used, the official registries are simulated, all libraries are open source and design '
        'works are based on the privacy practice of HIPAA Security Rule [2].')

    r.h2('1.3 Profile of the Target Users and the Elicitation Process')
    r.h3('1.3.1 Target Users')
    r.bullets([
        'Patients are citizens who are looking for one record in their control, that\u2019s it.',
        ('Doctors: ', 'Registered doctor of the BMDC which needs the history during a doctor visit.'),
        ('Diagnostic labs: ', 'A diagnostic lab that is licensed by the DGHS and that generates a report.'),
        'Administrator is the first person to check providers, and handle the account.',
    ])
    r.h3('1.3.2 User Profile')
    r.table(['User', 'Typical profile', 'Main need'], [
        ['Patient', 'All ages; mostly uses a mobile phone; basic to moderate digital skills; may prefer Bangla.',
         'See their own records and reports; decide who can read them.'],
        ['Doctor', 'Busy clinician; uses a laptop or phone in the chamber; moderate to high digital skills.',
         'Find the patient fast and understand the history in a minute.'],
        ['Lab staff', 'Front-desk or report staff of a diagnostic centre; works on a desktop.',
         'Attach the right report to the right patient and test.'],
        ['Admin', 'Technical operator with high digital skills.',
         'Keep fake doctors and labs out; keep the platform healthy.'],
    ], [1.0, 2.9, 2.1], caption='Target user profiles', chapter=1)
    r.h3('1.3.3 Elicitation Process')
    r.p('Five methods were used for collecting the requirements:')
    r.numbered([
        ('Observation \u2013 ', 'patients\u2019 way of carrying prescriptions/reports, and how they were read in the '
                                'as-brief-as-it-could-be consultation by the doctor.'),
        ('Study of existing systems: ', 'Health App\u2019s and e-Health initiatives studied, here it was found that in '
                                        'the case of these system, there is only record keeping in one health provider '
                                        'and also no record of consent & accesses log for the patient.'),
        ('Document review. ', 'The BMDC registration and DGHS licensing process, HIPAA Security Rule [2] and OWASP '
                              'Top 10 [3] documents had an impact on the verification and security requirements.'),
        ('Scenario analysis: ', 'Realistic stories, e.g. a patient with diabetes and a penicillin allergy becomes ill '
                                'in another city were translated to use cases.'),
        ('Supervisor feedback: ', 'requirements as set with the supervisor building on the mid defence.'),
    ])

    r.h2('1.4 Project Block Diagram')
    fig = r.next_figure(1)
    r.p(f'As can be seen in {fig}, there are 4 main blocks: the React web app that will be available for all roles, '
        'the Node.js server containing the business modules, data (PostgreSQL and Cloudinary), and externally-mounted '
        'services (Gemini, SMS and e-mail).')
    r.figure(DIAGRAMS / 'Block Diagram v3.png', 'Block diagram of HealthNexus BD', 1)

    r.h2('1.5 System Requirements')
    r.h3('1.5.1 Hardware Requirements')
    r.bullets([
        'User: Any sort of mobile or computer that can run a modern web browser and patients must also have a mobile '
        'that supports SMS.',
        'Development: dual core CPU 2.0 GHz, 8 GB of RAM, 10 GB free disk space.',
        'The hosting of those is through no own server \u2013 managed cloud services.',
    ])
    r.h3('1.5.2 Software Requirements')
    r.table(['Purpose', 'Software'], [
        ['Operating system', 'Windows 10/11, macOS or Linux (development); Linux containers on Render (production)'],
        ['Runtime', f'Node.js {F["v_node"]}'],
        ['Database', 'PostgreSQL 16 (Neon in production, embedded PostgreSQL for tests)'],
        ['Frontend', f'React {F["v_react"]}, Vite {F["v_vite"]}, TypeScript {F["v_ts"]}, Tailwind CSS {F["v_tailwind"]}'],
        ['Backend', f'Express {F["v_express"]}, Prisma {F["v_prisma"]}, Zod {F["v_zod"]}'],
        ['Testing', f'Vitest {F["v_vitest"]}, Supertest'],
        ['Tools', 'Visual Studio Code, Git and GitHub, draw.io, Figma, Postman'],
        ['Client browser', 'Chrome, Edge, Firefox or Safari (recent versions), JavaScript enabled'],
    ], [1.6, 4.4], caption='Software requirements', chapter=1)
    r.h3('1.5.3 Constraints and Dependencies')
    r.bullets([
        'The free Render server is auto-sleeping when idle, meaning that a scheduled health check is needed to ensure '
        'it\u2019s awake.',
        f'Lab reports should be in PDF format that is \u2264 {F["pdf_mb"]} MB.',
        'AI output will be \u2018advisory\u2019 only; fallback to every AI feature.',
        'External services: Gmail SMTP, Cloudinary, Neon, Gemini and BulkSMSBD.',
    ])

    r.h2('1.6 Project Scheduling')
    r.h3('1.6.1 Development Timeline')
    r.table(['Phase', 'Duration', 'Activities', 'Deliverables'], [
        ['1. Planning', '22 Jun – 12 Jul 2026', 'Proposal, requirement analysis, SRS, UML and database design',
         'Approved proposal, SRS, UML and ER diagrams'],
        ['2. Mid-defense', '13 – 25 Jul 2026', 'Presentation and design review', 'Mid-defense slides'],
        ['3. UI/UX design', '26 Jul – 12 Aug 2026', 'Wireframes and screens in Figma', 'Figma design'],
        ['4. Backend', '12 Aug – 30 Aug 2026', 'REST API, authentication, consent, records, lab, admin',
         'Working, tested API'],
        ['5. Security and testing', '1 Sep – 19 Oct 2026', 'Encryption, audit log, rate limits, automated tests',
         'Hardened backend and test suite'],
        ['6. Frontend', '19 Oct – 14 Nov 2026', 'App shell, i18n, dashboards for all roles, landing and login',
         'Complete web app'],
        ['7. AI and deployment', '14 – 24 Nov 2026', 'AI features, SMS gateway, Vercel and Render deployment',
         'Live system'],
        ['8. Report', '20 – 30 Nov 2026', 'Diagrams, screenshots and project report', 'This report'],
    ], [1.25, 1.35, 2.0, 1.4], caption='Development timeline', chapter=1)
    r.h3('1.6.2 Milestones')
    r.numbered([
        'M1 (1 Jul 2026): proposal accepted.',
        'M2 (25 Jul 2026): mid-defense completed.',
        'M3 (30 Aug 2026): backend API complete.',
        'M4 (19 Nov 2026): system live on the internet.',
        'M5 (30 Nov 2026): project report submitted.',
    ])
    r.figure(DIAGRAMS / 'Gantt Chart v3.png', 'Project Gantt chart', 1)

    r.summary_title()
    r.p('This chapter presented the problems for example, the scattering of medical records, purpose, scope of '
        'HealthNexus BD, feasibility, its users, block diagram, requirements and the schedule. The design and '
        'implementation will be discussed in the next chapter.')
