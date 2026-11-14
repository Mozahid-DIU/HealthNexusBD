import type { User } from '@prisma/client'
import { prisma } from '../../config/prisma.ts'
import { env } from '../../config/env.ts'
import { hashPassword, verifyPassword } from '../../utils/password.ts'
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../../utils/jwt.ts'
import { generateUhid } from '../../utils/uhid.ts'
import { generateOtpCode, hashOtp, verifyOtp } from '../../utils/otp.ts'
import { writeAudit } from '../../utils/audit.ts'
import { AppError } from '../../utils/AppError.ts'
import { isEmailConfigured, sendPasswordResetOtp } from '../../services/email.ts'
import { sendSms, smsIsSimulated } from '../../services/sms.ts'
import { logger } from '../../utils/logger.ts'
import { parseAccountIdentifier, type AccountLookup } from '../../utils/identifier.ts'
import type {
  LoginInput,
  RegisterInput,
  ResetPasswordInput,
} from './auth.schema.ts'

const GENERIC_RESET_MESSAGE = 'If an account exists, a reset code has been sent.'

/** Reset codes cost an SMS each: one a minute and five an hour per account at most. */
const RESET_RESEND_COOLDOWN_MS = 60_000
const RESET_MAX_PER_HOUR = 5
/** One answer for every way a reset code can be wrong, so it never reveals an account. */
const INVALID_RESET_CODE = 'Invalid or expired code. Check it, or request a new one.'
/**
 * Forgot-password answers take at least this long whether or not the account exists,
 * so response time can't reveal it either (the code itself is sent in the background).
 */
const RESET_MIN_RESPONSE_MS = 700

/** The account an email or mobile number refers to (null when it is neither). */
function findAccount(lookup: AccountLookup | null) {
  if (!lookup) return null
  return prisma.user.findFirst({ where: 'email' in lookup ? { email: lookup.email } : { phone: lookup.phone } })
}

function minutesFromNow(mins: number): Date {
  return new Date(Date.now() + mins * 60_000)
}

/** Build the auth token pair for a user. */
function issueTokens(user: Pick<User, 'id' | 'role' | 'tokenVersion'>) {
  return {
    accessToken: signAccessToken({ sub: user.id, role: user.role, ver: user.tokenVersion }),
    refreshToken: signRefreshToken({ sub: user.id, ver: user.tokenVersion }),
  }
}

/** Shape a user + their role profile into a safe public object (no password hash). */
export async function getProfile(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { patient: true, doctor: true, lab: true, admin: true },
  })
  if (!user) throw AppError.notFound('User not found')

  const { passwordHash: _omit, ...safe } = user
  return safe
}

export async function register(input: RegisterInput) {
  const { role, email, phone, password } = input
  const passwordHash = await hashPassword(password)
  // Picked before the transaction: its lookups use their own connection, so running
  // them inside would only burn the transaction's time budget.
  const uhid = role === 'patient' ? await generateUhid() : null

  const user = await prisma.$transaction(async (tx) => {
    if (role === 'patient') {
      if (!uhid) throw new Error('UHID was not generated')
      return tx.user.create({
        data: {
          email,
          phone,
          passwordHash,
          role: 'patient',
          status: 'active', // patients are active immediately
          patient: {
            create: {
              uhid,
              nid: input.nid,
              fullName: input.fullName,
              dateOfBirth: input.dateOfBirth ?? null,
              gender: input.gender ?? null,
              bloodGroup: input.bloodGroup ?? null,
            },
          },
        },
      })
    }

    if (role === 'doctor') {
      // Verify the BMDC number against the mock council registry.
      const entry = await tx.doctorRegistry.findUnique({
        where: { bmdcNumber: input.bmdcNumber },
      })
      if (!entry) {
        throw AppError.badRequest('This BMDC number is not in the medical council registry')
      }
      if (entry.isClaimed) {
        throw AppError.conflict('This BMDC number is already registered')
      }

      const created = await tx.user.create({
        data: {
          email,
          phone,
          passwordHash,
          role: 'doctor',
          status: 'pending', // awaits admin/BMDC verification
          doctor: {
            create: {
              bmdcNumber: entry.bmdcNumber,
              fullName: entry.fullName, // trusted from the BMDC registry, not user input
              specialization: entry.specialization ?? input.specialization ?? null,
            },
          },
        },
      })

      // Lock the registry entry so the same number can't be claimed twice.
      await tx.doctorRegistry.update({
        where: { id: entry.id },
        data: { isClaimed: true, claimedByUserId: created.id },
      })
      return created
    }

    // lab — verify the licence number against the mock DGHS registry.
    const entry = await tx.labRegistry.findUnique({
      where: { licenseNumber: input.licenseNumber },
    })
    if (!entry) {
      throw AppError.badRequest('This licence number is not in the DGHS registry')
    }
    if (entry.isClaimed) {
      throw AppError.conflict('This licence number is already registered')
    }

    const created = await tx.user.create({
      data: {
        email,
        phone,
        passwordHash,
        role: 'lab',
        status: 'pending', // awaits admin approval
        lab: {
          create: {
            licenseNumber: entry.licenseNumber,
            centerName: entry.centerName, // trusted from the DGHS registry
            address: entry.address ?? input.address ?? null,
          },
        },
      },
    })

    await tx.labRegistry.update({
      where: { id: entry.id },
      data: { isClaimed: true, claimedByUserId: created.id },
    })
    return created
  })

  const tokens = issueTokens(user)
  const profile = await getProfile(user.id)
  return { user: profile, ...tokens }
}

export async function login(input: LoginInput, ipAddress?: string) {
  const { identifier, password, portal } = input

  const user = await findAccount(parseAccountIdentifier(identifier))
  // Generic message to avoid user enumeration
  if (!user) throw AppError.unauthorized('Invalid credentials')

  const ok = await verifyPassword(password, user.passwordHash)
  if (!ok) throw AppError.unauthorized('Invalid credentials')
  // The admin console answers a non-admin exactly like a wrong password, so it never
  // confirms that someone else's credentials are valid.
  if (portal === 'admin' && user.role !== 'admin') throw AppError.unauthorized('Invalid credentials')

  if (user.status === 'suspended') {
    throw AppError.forbidden('This account has been suspended. Contact the administrator.', 'ACCOUNT_SUSPENDED')
  }

  const tokens = issueTokens(user)
  await writeAudit({ actorUserId: user.id, action: 'login', ipAddress: ipAddress ?? null })

  const profile = await getProfile(user.id)
  return { user: profile, ...tokens }
}

export async function refresh(refreshToken: string) {
  let payload
  try {
    payload = verifyRefreshToken(refreshToken)
  } catch {
    throw AppError.unauthorized('Invalid or expired refresh token', 'SESSION_INVALID')
  }
  const user = await prisma.user.findUnique({ where: { id: payload.sub } })
  if (!user) throw AppError.unauthorized('User no longer exists', 'SESSION_INVALID')
  if (user.status === 'suspended') throw AppError.forbidden('Account suspended', 'ACCOUNT_SUSPENDED')
  // A logout or password reset bumps tokenVersion, invalidating older refresh tokens.
  if (payload.ver !== user.tokenVersion) {
    throw AppError.unauthorized('Session is no longer valid. Please log in again.', 'SESSION_INVALID')
  }

  return { accessToken: signAccessToken({ sub: user.id, role: user.role, ver: user.tokenVersion }) }
}

/** Log out: invalidate every outstanding refresh token for the user. */
export async function logout(userId: string) {
  await prisma.user.update({
    where: { id: userId },
    data: { tokenVersion: { increment: 1 } },
  })
  return { message: 'Logged out successfully' }
}

/**
 * Start a password reset: send a one-time code to the email or phone the person typed
 * (so a phone number gets an SMS). Always the same answer, in about the same time,
 * whether or not the account exists.
 */
export async function forgotPassword(identifier: string) {
  const startedAt = Date.now()
  const lookup = parseAccountIdentifier(identifier)
  const user = await findAccount(lookup)
  const code = generateOtpCode()
  const codeHash = await hashOtp(code) // hashed for every request: same work either way

  let devOtp: string | undefined
  if (lookup && user && (await issueResetCode(user.id, codeHash))) {
    const byPhone = 'phone' in lookup
    const simulated = byPhone ? smsIsSimulated(user.phone) : !isEmailConfigured()
    // Sent after answering: a slow gateway must not reveal that the account exists.
    const delivery = byPhone
      ? sendSms(user.phone, resetSmsText(code), 'password reset')
      : sendPasswordResetOtp(user.email, code)
    delivery.catch((err: unknown) => logger.error({ err, userId: user.id }, 'Password reset code could not be delivered'))
    // Local testing only: show the code when nothing is really sent. Never in
    // production, where it would let anyone reset any account.
    if (simulated && env.NODE_ENV !== 'production') devOtp = code
  }

  const wait = (env.NODE_ENV === 'test' ? 0 : RESET_MIN_RESPONSE_MS) - (Date.now() - startedAt)
  if (wait > 0) await new Promise((resolve) => setTimeout(resolve, wait))
  return { message: GENERIC_RESET_MESSAGE, ...(devOtp ? { devOtp } : {}) }
}

function resetSmsText(code: string): string {
  return (
    `HealthNexus BD: Your password reset code is ${code}. ` +
    `It expires in ${env.OTP_TTL_MINUTES} minutes. Never share it with anyone.`
  )
}

/**
 * Store a new code unless this account was sent one under a minute ago, or five in the
 * last hour (each may be an SMS). Locked per account, so parallel requests can't all
 * pass the check at once. Returns whether a code was issued.
 */
async function issueResetCode(userId: string, codeHash: string): Promise<boolean> {
  return prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${userId}))`
    const recent = await tx.passwordResetToken.findMany({
      where: { userId, createdAt: { gte: new Date(Date.now() - 60 * 60_000) } },
      select: { createdAt: true },
      orderBy: { createdAt: 'desc' },
    })
    const last = recent[0]?.createdAt.getTime()
    if (recent.length >= RESET_MAX_PER_HOUR) return false
    if (last !== undefined && Date.now() - last < RESET_RESEND_COOLDOWN_MS) return false

    await tx.passwordResetToken.updateMany({ where: { userId, isUsed: false }, data: { isUsed: true } })
    await tx.passwordResetToken.create({
      data: { userId, codeHash, expiresAt: minutesFromNow(env.OTP_TTL_MINUTES), createdAt: new Date() },
    })
    return true
  })
}

/** Complete a password reset with a valid code, then rotate sessions. */
export async function resetPassword(input: ResetPasswordInput) {
  const user = await findAccount(parseAccountIdentifier(input.identifier))
  const token = user
    ? await prisma.passwordResetToken.findFirst({
        where: { userId: user.id, isUsed: false },
        orderBy: { createdAt: 'desc' },
      })
    : null
  if (!user || !token || token.expiresAt.getTime() < Date.now()) throw AppError.badRequest(INVALID_RESET_CODE)

  // Use up an attempt before checking, atomically, so parallel guesses can't exceed the cap.
  const claimed = await prisma.passwordResetToken.updateMany({
    where: { id: token.id, isUsed: false, attempts: { lt: env.OTP_MAX_ATTEMPTS } },
    data: { attempts: { increment: 1 } },
  })
  if (claimed.count === 0) throw AppError.tooMany('Too many incorrect attempts. Please request a new code.')
  if (!(await verifyOtp(input.code, token.codeHash))) throw AppError.badRequest(INVALID_RESET_CODE)

  const passwordHash = await hashPassword(input.newPassword)
  await prisma.$transaction(async (tx) => {
    // A code works once, even if two requests use it at the same moment.
    const used = await tx.passwordResetToken.updateMany({
      where: { id: token.id, isUsed: false },
      data: { isUsed: true },
    })
    if (used.count === 0) throw AppError.badRequest(INVALID_RESET_CODE)
    // Rotate tokenVersion so any existing sessions are logged out after a reset.
    await tx.user.update({
      where: { id: user.id },
      data: { passwordHash, tokenVersion: { increment: 1 } },
    })
  })

  return { message: 'Password has been reset. Please log in with your new password.' }
}
