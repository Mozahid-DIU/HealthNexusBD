import type { NotificationType } from '@prisma/client'
import { prisma } from '../config/prisma.ts'
import { logger } from '../utils/logger.ts'
import { sendSms } from './sms.ts'

/**
 * Patient notifications (SRS FR-21): new lab reports and follow-up reminders.
 *
 * Each one is stored in-app (the patient's inbox) and also sent by SMS. Delivery is
 * best-effort: a failed SMS is logged and never fails the action that triggered it,
 * and the in-app copy is written first so the patient always has it.
 *
 * Privacy: SMS text is generic. Test names and diagnoses stay inside the app, since an
 * SMS can be read by anyone holding the phone.
 */

interface PatientNotice {
  patientId: string
  type: NotificationType
  title: string
  body: string
  sms: string
}

async function notifyPatient(notice: PatientNotice): Promise<void> {
  const patient = await prisma.patient.findUnique({
    where: { id: notice.patientId },
    select: { user: { select: { phone: true } } },
  })
  if (!patient) return

  await prisma.notification.create({
    data: { patientId: notice.patientId, type: notice.type, title: notice.title, body: notice.body },
  })

  try {
    await sendSms(patient.user.phone, notice.sms, `${notice.type} notification`)
  } catch (err) {
    logger.error({ err, patientId: notice.patientId, type: notice.type }, 'Notification SMS failed')
  }
}

// ---------------------------------------------------------------- new lab report

/** Tell the patient a lab report is ready. Never throws into the upload request. */
export async function notifyLabReportReady(input: {
  patientId: string
  testName: string
  labName: string
}): Promise<void> {
  try {
    await notifyPatient({
      patientId: input.patientId,
      type: 'lab_report',
      title: 'New lab report available',
      body: `Your ${input.testName} report from ${input.labName} is ready to view.`,
      sms: 'HealthNexus BD: A new lab report is available in your account. Log in to view it.',
    })
  } catch (err) {
    logger.error({ err, patientId: input.patientId }, 'Failed to record lab report notification')
  }
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
        sms: `HealthNexus BD: Reminder - you have a follow-up visit on ${when}. Log in for details.`,
      })
      sent += 1
    } catch (err) {
      logger.error({ err, recordId: record.id }, 'Failed to send follow-up reminder')
    }
  }

  if (sent > 0) logger.info({ sent }, 'Follow-up reminders sent')
  return sent
}
