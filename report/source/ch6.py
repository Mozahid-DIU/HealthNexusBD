"""Chapter 6: Project summary, plus the references and the end pages."""
from facts import F

REFERENCES = [
    'World Health Organization, “Global Strategy on Digital Health 2020–2025,” Geneva, Switzerland, 2021. '
    '[Online]. Available: https://www.who.int/publications/i/item/9789240020924',
    'U.S. Department of Health and Human Services, “The HIPAA Security Rule,” 45 CFR Part 160 and Part 164, '
    'Subparts A and C. [Online]. Available: https://www.hhs.gov/hipaa/for-professionals/security/index.html',
    'OWASP Foundation, “OWASP Top 10: 2021.” [Online]. Available: https://owasp.org/Top10/',
    'National Institute of Standards and Technology, “Advanced Encryption Standard (AES),” FIPS PUB 197, '
    'Nov. 2001 (updated May 2023).',
    'M. Dworkin, “Recommendation for Block Cipher Modes of Operation: Galois/Counter Mode (GCM) and GMAC,” '
    'NIST Special Publication 800-38D, Nov. 2007.',
    'N. Provos and D. Mazières, “A Future-Adaptable Password Scheme,” in Proc. USENIX Annual Technical '
    'Conference, FREENIX Track, Monterey, CA, USA, 1999, pp. 81–91.',
    'M. Jones, J. Bradley and N. Sakimura, “JSON Web Token (JWT),” RFC 7519, IETF, May 2015.',
    'R. T. Fielding, “Architectural Styles and the Design of Network-based Software Architectures,” Ph.D. '
    'dissertation, University of California, Irvine, CA, USA, 2000.',
    'Meta Platforms, Inc., “React Documentation.” [Online]. Available: https://react.dev/',
    'OpenJS Foundation, “Express – Node.js web application framework.” [Online]. Available: '
    'https://expressjs.com/',
    'Prisma Data, Inc., “Prisma ORM Documentation.” [Online]. Available: https://www.prisma.io/docs',
    'The PostgreSQL Global Development Group, “PostgreSQL 16 Documentation.” [Online]. Available: '
    'https://www.postgresql.org/docs/16/',
    'Google, “Gemini API Documentation.” [Online]. Available: https://ai.google.dev/gemini-api/docs',
    'Vitest, “Vitest: Next Generation Testing Framework.” [Online]. Available: https://vitest.dev/',
    'Bangladesh Medical and Dental Council, “Registered Doctors.” [Online]. Available: https://www.bmdc.org.bd/',
    'Directorate General of Health Services, Bangladesh. [Online]. Available: https://dghs.gov.bd/',
    'Render, “Render Documentation.” [Online]. Available: https://render.com/docs',
    'Vercel, “Vercel Documentation.” [Online]. Available: https://vercel.com/docs',
    'I. Sommerville, Software Engineering, 10th ed. Boston, MA, USA: Pearson, 2016.',
    'R. C. Martin, Clean Code: A Handbook of Agile Software Craftsmanship. Upper Saddle River, NJ, USA: '
    'Prentice Hall, 2008.',
]


def build(r):
    r.page_break()
    r.h1('Project Summary', chapter=6)
    r.h2('6.1 Introduction')
    r.p('This chapter encapsulates the work of the project its achievements, limitations and future work.')

    r.h2('6.2 Project Achievements')
    r.bullets([
        'One UHID, One Secure history \u2013 One for every patient!',
        'Registered Doctors with BMDC number and Lab registered with DGHS licence and admin approved.',
        f'Use patient\u2019s SMS OTP to access for {F["session_min"]} minutes \u2013 deny / revoke anytime.',
        'AES-256-GCM encryption, hashed secrets, instant sign out and append-only audit log.',
        'AI summary and allergy alerts with rule based fall-back, and bilingual health assistant.',
        f'{F["tests_total"]} passing tests, a backend line coverage of {F["cov_lines"]} and a live deployment.',
    ])

    r.h2('6.3 Project Limitations')
    r.numbered([
        'The BMDC and DGHS checks are not from official databases but from so-called seeded tables.',
        'Free Render server \u2013 Not yet designed to work with national traffic loads.',
        'Only frequently used drug interactions are reviewed.',
        'No offline or mobile app(s).',
        'Emergency access is not allowed if the Patient is unable to give an OTP.',
        'Not yet used in a real clinic.',
    ])

    r.h2('6.4 Future Work Opportunities')
    r.bullets([
        ('Medium term: ', 'integration of the official registry and complete database of the interaction between '
                          'drugs, upload of old reports, marked as unverified, by patients and a controlled emergency '
                          'access mode.'),
        'Towards the long-term, offline mobile apps, embedding the national health ID, data exchange via HL7 FHIR and '
        'risk prediction and verifiable e-prescriptions.',
    ])

    r.h2('6.5 Conclusion')
    r.p('We can achieve a patient-owned, unified health record in today\u2019s reality, as part of achieving that vision, '
        'HealthNexus BD will help realize the vision in the context of Bangladesh. It brings all the records into one '
        'place, so that it is centralized and helps in safeguarding the patient as nothing would be able to be read '
        'without the patient\u2019s OTP and any access will be visible to the patient.')
    r.p('Plus it had been built from scratch; from requirements to deployment it\u2019s been a learning curve for me, '
        'teaching me secure API design, data modelling, testing and integrating AI and deployment on the cloud. When '
        'it\u2019s got some genuine registry ties, field trials can turn it into a vital tool towards a safer, well '
        'connected health care.')

    r.page_break()
    r.h1('References')
    for i, ref in enumerate(REFERENCES, start=1):
        para = r.p(f'[{i}]\t{ref}', align='left', space_after=6)
        fmt = para.paragraph_format
        from docx.shared import Cm
        fmt.left_indent = Cm(1.0)
        fmt.first_line_indent = Cm(-1.0)
        fmt.tab_stops.add_tab_stop(Cm(1.0))
        fmt.line_spacing = 1.15
    # Library clearance, plagiarism report and AI report pages are left out for now (user's request).
