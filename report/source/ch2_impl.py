"""Chapter 2, part 2: architecture, implementation details and sample code (Appendix A)."""
from facts import F

CODE_ROUTES = r'''
export const consentRouter = Router()

// Doctor: request access and verify the OTP
consentRouter.post('/request', authenticate, requireRole('doctor'), authLimiter,
  validate(requestAccessSchema), requestAccessController)
consentRouter.post('/verify', authenticate, requireRole('doctor'), authLimiter,
  validate(verifyOtpSchema), verifyAccessController)

// Patient: deny a request or revoke a session
consentRouter.post('/requests/:id/deny', authenticate, requireRole('patient'),
  validate(idParamSchema, 'params'), denyController)
consentRouter.post('/sessions/:id/revoke', authenticate, requireRole('patient'),
  validate(idParamSchema, 'params'), revokeController)
'''

CODE_VERIFY = r'''
// Use up an attempt before checking, atomically, so parallel guesses can't exceed the cap.
const claimed = await prisma.otpToken.updateMany({
  where: { id: token.id, isUsed: false, attempts: { lt: env.OTP_MAX_ATTEMPTS } },
  data: { attempts: { increment: 1 } },
})
if (claimed.count === 0) {
  throw AppError.tooMany('Too many incorrect attempts. Please request a new code.')
}
const ok = await verifyOtp(input.code, token.codeHash)
if (!ok) throw AppError.badRequest('Invalid code.')

// Success: consume the token and open a time-boxed session, atomically.
const session = await prisma.$transaction(async (tx) => {
  const created = await tx.accessSession.create({
    data: { patientId: token.patientId, doctorId: doctor.id, status: 'active',
            expiresAt: minutesFromNow(env.SESSION_TTL_MINUTES) },
  })
  const used = await tx.otpToken.updateMany({
    where: { id: token.id, isUsed: false },
    data: { isUsed: true, sessionId: created.id },
  })
  if (used.count === 0) throw AppError.badRequest('This code has already been used')
  return created
})
await writeAudit({ actorUserId: userId, action: 'grant', patientId: token.patientId,
                   resource: `session:${session.id}`, ipAddress })
'''

CODE_CRYPTO = r'''
const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 12 // 96-bit nonce is the recommended size for GCM
const KEY = Buffer.from(env.AES_SECRET_KEY, 'hex')

export function encrypt(plaintext: string): string {
  const iv = crypto.randomBytes(IV_LENGTH)
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv)
  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const authTag = cipher.getAuthTag()
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${ciphertext.toString('hex')}`
}

export function decrypt(payload: string): string {
  const parts = payload.split(':')
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted payload format')
  }
  const [ivHex, tagHex, dataHex] = parts
  const iv = Buffer.from(ivHex, 'hex')
  const authTag = Buffer.from(tagHex, 'hex')
  const data = Buffer.from(dataHex, 'hex')

  const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv)
  decipher.setAuthTag(authTag)   // a tampered ciphertext fails the tag check here
  const plaintext = Buffer.concat([decipher.update(data), decipher.final()])
  return plaintext.toString('utf8')
}
'''

CODE_PRISMA = r'''
model AccessSession {
  id        String        @id @default(uuid()) @db.Uuid
  patientId String        @map("patient_id") @db.Uuid
  doctorId  String        @map("doctor_id") @db.Uuid
  status    SessionStatus @default(active)
  grantedAt DateTime      @default(now()) @map("granted_at") @db.Timestamptz(6)
  expiresAt DateTime      @map("expires_at") @db.Timestamptz(6)

  patient  Patient   @relation(fields: [patientId], references: [id], onDelete: Cascade)
  doctor   Doctor    @relation(fields: [doctorId], references: [id])
  otpToken OtpToken?

  @@index([doctorId, status])
  @@map("access_sessions")
}
'''

CODE_REACT = r'''
const verify = useMutation({
  mutationFn: (value: string) =>
    doctorApi.verifyAccess({ requestId: request.requestId, code: value }),
  onSuccess: (res) => onVerified(res.data.expiresAt),
  onError: () => setCode(''),
})
// 429 means the code is locked after too many wrong tries
const locked = verify.error instanceof ApiError && verify.error.status === 429

const submit = (value: string) => {
  if (value.length === 6 && !expired && !verify.isPending) verify.mutate(value)
}
'''


def build(r):
    r.h2('2.5 Implementation')
    r.h3('2.5.1 System Architecture')
    r.p('To store encrypted lab files, a Cloudinary service is used, along with a three-tiered system consisting of a '
        'React app on Vercel and a REST API designed with Express on Render [8] and a PostgreSQL database on Neon. '
        'The API doesn\u2019t maintain any sessions in memory, so more API instances can be dynamically added at a '
        'later point in time, without redesign.')
    r.p('All secure requests go through the same chain in the same sequence:')
    r.numbered([
        'Rate limiting is to avoid abusive callers.',
        'The token is verified and the user is read again from the database, so a suspended user is blocked when he '
        'tries to make a request again.',
        'The role is verified either with the patient, or with the doctor or the lab/admin.',
        'Body, query & parameters are validated with Zod.',
        'A thin controller sends the input to a service which has the business logic, reads and writes to a '
        'database, writes the audit log.',
        'All errors are converted to a safe JSON message, without any internal details.',
    ])

    r.h3('2.5.2 Technology Stack')
    r.table(['Layer', 'Technology', 'Reason for the choice'], [
        ['Frontend', f'React {F["v_react"]} [9], TypeScript, Vite, Tailwind CSS {F["v_tailwind"]}',
         'Fast, component-based UI with type safety and a utility-first design system'],
        ['State and data', 'TanStack Query, Zustand, React Hook Form', 'Caching of server data, a small auth store '
                                                                       'and validated forms'],
        ['Language', 'i18next', 'Full English and Bangla translation'],
        ['Backend', f'Node.js {F["v_node"]}, Express {F["v_express"]} [10], TypeScript', 'Mature, lightweight and shares '
                                                                                   'one language with the frontend'],
        ['Database', f'PostgreSQL [12] with Prisma {F["v_prisma"]} [11]', 'ACID transactions, foreign keys, type-safe and '
                                                                 'parameterised queries'],
        ['Validation', 'Zod', 'One schema validates input and gives TypeScript types'],
        ['Security', 'bcryptjs, jsonwebtoken, helmet, express-rate-limit, Node crypto', 'Hashing, tokens, secure '
                                                                                        'headers, throttling, AES'],
        ['AI', 'Google Gemini API', 'Fast, low-cost models with JSON output'],
        ['Messaging', 'BulkSMSBD, Gmail SMTP (Nodemailer)', 'OTP by SMS and reset codes by e-mail'],
        ['Files', 'Cloudinary', 'Managed storage for encrypted PDFs'],
        ['Testing', f'Vitest {F["v_vitest"]} [14], Supertest, Testing Library, embedded PostgreSQL', 'Fast tests against '
                                                                                               'a real database'],
    ], [1.1, 2.3, 2.6], caption='Technology stack', chapter=2, font=10)

    r.h3('2.5.3 Backend Modules')
    r.table(['Module', 'Responsibility'], [
        ['auth', 'Registration for all roles, login, token refresh, logout, password reset'],
        ['consent', 'OTP requests, OTP verification, session lists, deny and revoke'],
        ['doctor', 'Patient search, chart, records, prescriptions, AI summary and AI overview'],
        ['patient', 'Profile, records, lab reports, notifications and the personal access log'],
        ['lab', 'Patient search with prescribed tests, report upload and upload history'],
        ['admin', 'Dashboard counts, trends, verifications, user management and the audit log'],
        ['assistant', 'The patient health assistant chat'],
        ['health', 'Server and database health check used by the uptime monitor'],
    ], [1.2, 4.8], caption='Backend modules', chapter=2, font=10)

    r.h3('2.5.4 Security Implementation')
    r.bullets([
        'The bcrypt (cost 12) hashing algorithm is used to store passwords [6] and OTPs and reset codes are stored as '
        'a hash.',
        'One 15 minute access token and one 7 day refresh token [7] \u2013 sign out, reset and suspension \u2013 log '
        'them out anywhere.',
        f'Every session has a 6 digit OTP (valid for {F["otp_min"]} mins and {F["otp_tries"]} attempts).',
        'AES 256 GCM [4, 5] is used to encrypt all clinical notes and lab PDFs which are only served from '
        'authenticated-endpoints.',
        'Admin View only metadata and labs view only tests that they were told to perform(or examine).',
        'Helmet, CORS, Zod and rate limits help to mitigate the OWASP risks; database triggers make the audit log '
        'append only.',
    ])

    r.h3('2.5.5 AI Implementation')
    r.p('A server makes direct requests to the Gemini API [13] using https. It keeps an up-to-date list of all fast '
        'models, and will switch to the next one if the model in use is not available, or if it does not respond '
        'within 12 seconds. AI is used only as an assistant: it never changes what the doctor writes.')
    r.p('To maintain the highest possible level of privacy, names, UHIDs, NIDs, phone numbers and e-mail addresses '
        'are stripped from any text before it leaves the server, and visit dates are limited to the month.')
    r.bullets([
        ('Clinical summary: ', 'At the end of the visit, Gemini will offer a concise, easily understood summary in '
                               'brief simple json format, as well as warnings about allergies and drug interactions.'),
        ('Rule based Safety Net: ', 'Stateless rules which are evaluated every time and used with the result of the '
                                    'AI. An alert is, for example, always raised when the doctor prescribes '
                                    'Amoxicillin to a patient with a known penicillin allergy. If Gemini is offline, '
                                    'the rule-based summary will be shown to always provide the doctor with a '
                                    'warning.'),
        ('Doctor overview: ', '1-screen overview of all the history, kept cached for 30 minutes as long as the '
                              'history does not change.'),
        ('Healthcare assistant: ', 'The healthcare assistant will engage the patient in a conversation as the patient '
                                   'query in either Bangla or English, with a consent notice (present and accepted) '
                                   'by the patient. The 999 advice is displayed separately in the emergency detector '
                                   'in case of AI failure and the assistant never diagnoses, prescribes or changes '
                                   'the dose. Chats are not saved in the server.'),
    ])

    r.h3('2.5.6 Frontend Implementation')
    r.p('The frontend is arranged by feature and then access to the features grouped by a protected route per role. '
        'The server data is managed by TanStack Query, the translations are done via i18next and the layout is '
        'responsive using Tailwind CSS. Admin Charts are just simple SVG.')

    r.h2('2.6 Coding: Appendix A')
    r.p('Below is a moderately short sample of the actual source code (with some of the lines being shortened):')
    r.h3('A.1 Express Routes with Guards (Consent Module)')
    r.code(CODE_ROUTES)
    r.h3('A.2 OTP Verification Service')
    r.code(CODE_VERIFY)
    r.h3('A.3 AES-256-GCM Encryption Utility')
    r.code(CODE_CRYPTO)
    r.h3('A.4 Prisma Model (Access Session)')
    r.code(CODE_PRISMA)
    r.h3('A.5 React Code (OTP Entry)')
    r.code(CODE_REACT)

    r.summary_title()
    r.p('In this chapter, the requirements have been described using UML and ER patterns, and for the architecture, '
        'security, AI and frontend, the descriptions have been provided, along with code samples. Testing is '
        'addressed in next chapter.')
