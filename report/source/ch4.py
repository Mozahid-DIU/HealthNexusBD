"""Chapter 4: Deployment and maintenance."""
from facts import F, DIAGRAMS


def build(r):
    r.page_break()
    r.h1('Deployment and Maintenance', chapter=4)
    r.h2('4.1 Introduction')
    r.p('This chapter describes how the system was released, how production is set up and how it is maintained.')

    r.h2('4.2 Following Software Release Life Cycle (SRLC)')
    r.h3('4.2.1 Alpha Release')
    r.p('The alpha version was installed on the developer\u2019s computer, and was populated with a local database with '
        'demo logins for all of the roles. First developed the backend, then each dashboard and each change was '
        'inspected by running the tests.')
    r.h3('4.2.2 Beta Release')
    r.p('A demo deployment of the beta version was made on Vercel, Render and Neon. English and Bangla workflow was '
        'showcased on Laptop and Phone to all the actors right from the beginning of the workflow. Any problems which '
        'have been detected here (such as the free server going to sleep when idle) have been fixed before being '
        'released.')
    r.h3('4.2.3 Release Candidate')
    r.p(f'At this time only bugs were accepted, changes of the features were not. All {F["tests_total"]} automated '
        'tests are passed and the security settings are checked: secrets are stored only in environment variables, '
        'demo OTP mode is only used with predefined and seeded demo numbers and CORS is only enabled for the frontend '
        'address.')
    r.h3('4.2.4 Production Release')
    r.table(['Item', 'Value'], [
        ['Version', '1.0.0'],
        ['Release date', 'November 2026'],
        ['Web application', 'https://healthnexus-bd.vercel.app'],
        ['API', f'{F["api_url"]}/api'],
        ['Hosting', 'Vercel [18] (frontend), Render [17], Ohio region (backend), Neon (PostgreSQL), Cloudinary (files)'],
        ['Monitoring', 'GitHub Actions health check every 5 minutes; Render and Vercel logs'],
    ], [1.6, 4.4], caption='Production release details', chapter=4, font=10)

    r.h2('4.3 Deployment Architecture')
    fig = r.next_figure(4)
    r.p(f'The browser accesses the Vercel-hosted React app, calls the Render-hosted API over HTTPS ({fig}). When '
        'pushed to the main branch, it will deploy automatically and GitHub actions invoke the health endpoint every '
        '5 mins to keep the server alive.')
    r.figure(DIAGRAMS / 'Deployment Architecture v3.png', 'Production deployment architecture', 4)

    r.h3('4.3.1 Configuration')
    r.p('The secrets are all environment variables and are checked at startup using Zod.')
    r.table(['Variable', 'Purpose'], [
        ['DATABASE_URL', 'Connection string of the Neon PostgreSQL database'],
        ['JWT_ACCESS_SECRET, JWT_REFRESH_SECRET', 'Signing keys for access and refresh tokens'],
        ['AES_SECRET_KEY', '256-bit key for AES-256-GCM encryption'],
        ['GEMINI_API_KEY', 'Access to the Gemini API'],
        ['SMS_API_KEY, OTP_MODE', 'BulkSMSBD access and the real or demo OTP mode'],
        ['EMAIL_USER, EMAIL_APP_PASSWORD', 'Gmail SMTP account for reset codes'],
        ['CLOUDINARY_*', 'File storage account'],
        ['CORS_ORIGIN, TRUST_PROXY', 'Allowed frontend origin and proxy setting on Render'],
        ['VITE_API_URL (frontend)', 'Address of the API; the production build fails without it'],
    ], [2.6, 3.4], caption='Main environment variables', chapter=4, font=10)

    r.h3('4.3.2 Deployment Steps')
    r.numbered([
        'To create Neon database and run Prisma migrations.',
        'Seed both registries and admin account.',
        'Create the Render service and set the environment variables.',
        'Set up the Vercel project and configure the VITE_API_URL and the property CORS_ORIGIN.',
        'setup keep alive workflow and test health endpoint.',
    ])

    r.h2('4.4 Maintenance Procedures')
    r.bullets([
        'Review the health check and logs, check for pending doctor/lab applications to be reviewed daily.',
        ('Weekly: ', 'conduct weekly review of audit log, review SMS balance, conduct weekly Gemini review, fix bugs '
                     'with a new test for each.'),
        ('Monthly: ', 'Update for any dependencies, inspect storage space, test database restores and rotate any '
                      'exposed secrets.'),
    ])

    r.h2('4.5 Summary')
    r.p('Tested during the alpha, beta and RC phases before going into production in November 2026\u2014following easy '
        'routines keeps it healthy. The next chapter is named the user manual.')
