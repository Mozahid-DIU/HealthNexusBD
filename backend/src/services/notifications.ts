import type { NotificationType } from '@prisma/client'
import { prisma } from '../config/prisma.ts'
import { logger } from '../utils/logger.ts'

/**
 * Patient notifications (SRS FR-21), shown in the patient's in-app inbox: new lab
 * reports, follow-up reminders, and doctor activity (an access request, access
 * granted, a new visit).
 *
 * In-app only: SMS carries nothing but one-time codes (consent and password reset).
 * Delivery is best-effort and never fails the action that triggered it.
 *
 * Privacy: a notification names who did what, never clinical notes or codes.
 */

interface PatientNotice {
  patientId: string
  type: NotificationType
  /** English fallback text (clients render `params` in the user's language instead). */
  title: string
  body: string
  /** The values in `body`, so clients can show the message in the user's language. */
  params: Record<string, string>
}

async function notifyPatient(notice: PatientNotice): Promise<void> {
  await prisma.notification.create({
    data: {
      patientId: notice.patientId,
      type: notice.type,
      title: notice.title,
      body: notice.body,
      params: notice.params,
    },
  })
}

/** Record a notification; a failure is logged and never reaches the caller. */
async function notifySafely(notice: PatientNotice): Promise<void> {
  try {
    await notifyPatient(notice)
  } catch (err) {
    logger.error({ err, patientId: notice.patientId, type: notice.type }, 'Failed to record patient notification')
  }
}

// ---------------------------------------------------------------- new lab report

/** Tell the patient a lab report is ready. Never throws into the upload request. */
export async function notifyLabReportReady(input: {
  patientId: string
  testName: string
  labName: string
}): Promise<void> {
  await notifySafely({
    patientId: input.patientId,
    type: 'lab_report',
    title: 'New lab report available',
    body: `Your ${input.testName} report from ${input.labName} is ready to view.`,
    params: { testName: input.testName, labName: input.labName },
  })
}

// ---------------------------------------------------------------- doctor activity

/** A doctor asked to see the records (the code itself goes only by SMS). */
export async function notifyAccessRequested(input: { patientId: string; doctorName: string }): Promise<void> {
  await notifySafely({
    patientId: input.patientId,
    type: 'consent_request',
    title: 'A doctor asked to see your records',
    body: `${input.doctorName} asked to see your records. Share the code from your SMS only if you are with this doctor.`,
    params: { doctorName: input.doctorName },
  })
}

/** The doctor entered the right code: their access is open until `expiresAt`. */
export async function notifyAccessGranted(input: {
  patientId: string
  doctorName: string
  expiresAt: Date
}): Promise<void> {
  await notifySafely({
    patientId: input.patientId,
    type: 'access_granted',
    title: 'A doctor can now see your records',
    body: `${input.doctorName} can see your records until ${input.expiresAt.toISOString()}. You can end this access at any time.`,
    params: { doctorName: input.doctorName, expiresAt: input.expiresAt.toISOString() },
  })
}

/** A doctor recorded a new visit (its note stays in the record, not the notification). */
export async function notifyNewRecord(input: {
  patientId: string
  doctorName: string
  diagnosis: string
  recordId: string
}): Promise<void> {
  await notifySafely({
    patientId: input.patientId,
    type: 'new_record',
    title: 'New visit recorded',
    body: `${input.doctorName} recorded a new visit: ${input.diagnosis}.`,
    params: { doctorName: input.doctorName, diagnosis: input.diagnosis, recordId: input.recordId },
  })
}

// ---------------------------------------------------------------- follow-up reminders

/** Bangladesh Standard Time is UTC+6 all year (no daylight saving). */
const DHAKA_OFFSET_MS = 6 * 60 * 60 * 1000
/** Reminders go out from this local hour on the day before the follow-up. */
export const REMINDER_HOUR = 9

const DATE_LABEL = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
})

/**
 * Send reminders for follow-ups due tomorrow (Bangladesh date), once it is past
 * REMINDER_HOUR in Bangladesh. Safe to run as often as you like and concurrently:
 * each record is claimed atomically before anything is sent, so a reminder goes out
 * at most once. Returns how many reminders this run sent.
 */
export async function sendFollowUpReminders(now: Date = new Date()): Promise<number> {
  const dhakaNow = new Date(now.getTime() + DHAKA_OFFSET_MS)
  if (dhakaNow.getUTCHours() < REMINDER_HOUR) return 0

  // follow_up_date is a DATE column; Prisma maps it to midnight UTC of that day.
  const tomorrow = new Date(
    Date.UTC(dhakaNow.getUTCFullYear(), dhakaNow.getUTCMonth(), dhakaNow.getUTCDate() + 1),
  )

  const due = await prisma.medicalRecord.findMany({
    where: { followUpDate: tomorrow, followUpReminderSentAt: null },
    select: { id: true, patientId: true, diagnosis: true },
  })

  let sent = 0
  for (const record of due) {
    // Claim first: only the run whose update matches the still-unsent row may notify.
    const claim = await prisma.medicalRecord.updateMany({
      where: { id: record.id, followUpReminderSentAt: null },
      data: { followUpReminderSentAt: now },
    })
    if (claim.count === 0) continue

    const when = DATE_LABEL.format(tomorrow)
    try {
      await notifyPatient({
        patientId: record.patientId,
        type: 'follow_up',
        title: 'Follow-up visit tomorrow',
        body: `Reminder: your follow-up visit${record.diagnosis ? ` for ${record.diagnosis}` : ''} is on ${when}.`,
        params: {
          date: tomorrow.toISOString().slice(0, 10),
          ...(record.diagnosis ? { diagnosis: record.diagnosis } : {}),
        },
      })
      sent += 1
    } catch (err) {
      logger.error({ err, recordId: record.id }, 'Failed to send follow-up reminder')
    }
  }

  if (sent > 0) logger.info({ sent }, 'Follow-up reminders sent')
  return sent
}
