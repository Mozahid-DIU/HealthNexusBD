import type { Prisma, User } from '@prisma/client'
import { prisma } from '../../config/prisma.ts'
import { env } from '../../config/env.ts'
import { hashPassword, verifyPassword } from '../../utils/password.ts'
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../../utils/jwt.ts'
import { generateUhid } from '../../utils/uhid.ts'
import { generateOtpCode, hashOtp, verifyOtp } from '../../utils/otp.ts'
import { writeAudit } from '../../utils/audit.ts'
import { AppError } from '../../utils/AppError.ts'
import { sendPasswordResetOtp } from '../../services/email.ts'
import type {
  LoginInput,
  RegisterInput,
  ResetPasswordInput,
} from './auth.schema.ts'

const GENERIC_RESET_MESSAGE = 'If an account exists for that email, a reset code has been sent.'

function minutesFromNow(mins: number): Date {
  return new Date(Date.now() + mins * 60_000)
}

/** Build the auth token pair for a user. */
function issueTokens(user: Pick<User, 'id' | 'role' | 'tokenVersion'>) {
  return {
    accessToken: signAccessToken({ sub: user.id, role: user.role }),
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

  const user = await prisma.$transaction(async (tx) => {
    if (role === 'patient') {
      const uhid = await generateUhid()
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
  const { identifier, password } = input

  const where: Prisma.UserWhereInput = identifier.includes('@')
    ? { email: identifier.toLowerCase() }
    : { phone: identifier }

  const user = await prisma.user.findFirst({ where })
  // Generic message to avoid user enumeration
  if (!user) throw AppError.unauthorized('Invalid credentials')

  const ok = await verifyPassword(password, user.passwordHash)
  if (!ok) throw AppError.unauthorized('Invalid credentials')

  if (user.status === 'suspended') {
    throw AppError.forbidden('This account has been suspended. Contact the administrator.')
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
    throw AppError.unauthorized('Invalid or expired refresh token')
  }
  const user = await prisma.user.findUnique({ where: { id: payload.sub } })
  if (!user) throw AppError.unauthorized('User no longer exists')
  if (user.status === 'suspended') throw AppError.forbidden('Account suspended')
  // A logout or password reset bumps tokenVersion, invalidating older refresh tokens.
  if (payload.ver !== user.tokenVersion) {
    throw AppError.unauthorized('Session is no longer valid. Please log in again.')
  }

  return { accessToken: signAccessToken({ sub: user.id, role: user.role }) }
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
 * Start a password reset: email a one-time code. Always returns the same generic
 * response so it never reveals whether an email is registered.
 */
export async function forgotPassword(email: string) {
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } })
  if (!user) return { message: GENERIC_RESET_MESSAGE }

  const code = generateOtpCode()
  const codeHash = await hashOtp(code)

  await prisma.$transaction(async (tx) => {
    await tx.passwordResetToken.updateMany({
      where: { userId: user.id, isUsed: false },
      data: { isUsed: true },
    })
    await tx.passwordResetToken.create({
      data: { userId: user.id, codeHash, expiresAt: minutesFromNow(env.OTP_TTL_MINUTES) },
    })
  })

  const delivery = await sendPasswordResetOtp(user.email, code)

  return {
    message: GENERIC_RESET_MESSAGE,
    // Demo affordance only: surface the code when no mailbox is configured.
    ...(delivery.mode === 'demo' ? { devOtp: code } : {}),
  }
}

/** Complete a password reset with a valid code, then rotate sessions. */
export async function resetPassword(input: ResetPasswordInput) {
  const user = await prisma.user.findUnique({ where: { email: input.email.toLowerCase() } })
  if (!user) throw AppError.badRequest('Invalid email or code')

  const token = await prisma.passwordResetToken.findFirst({
    where: { userId: user.id, isUsed: false },
    orderBy: { createdAt: 'desc' },
  })
  if (!token) throw AppError.badRequest('No active reset request. Please start again.')
  if (token.expiresAt.getTime() < Date.now()) {
    throw AppError.badRequest('This code has expired. Please request a new one.')
  }
  if (token.attempts >= env.OTP_MAX_ATTEMPTS) {
    throw AppError.tooMany('Too many incorrect attempts. Please request a new code.')
  }

  const ok = await verifyOtp(input.code, token.codeHash)
  if (!ok) {
    await prisma.passwordResetToken.update({
      where: { id: token.id },
      data: { attempts: { increment: 1 } },
    })
    throw AppError.badRequest('Invalid code')
  }

  const passwordHash = await hashPassword(input.newPassword)
  await prisma.$transaction([
    // Rotate tokenVersion so any existing sessions are logged out after a reset.
    prisma.user.update({
      where: { id: user.id },
      data: { passwordHash, tokenVersion: { increment: 1 } },
    }),
    prisma.passwordResetToken.update({ where: { id: token.id }, data: { isUsed: true } }),
  ])

  return { message: 'Password has been reset. Please log in with your new password.' }
}
