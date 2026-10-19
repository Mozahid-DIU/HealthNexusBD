/**
 * Send any due follow-up reminders once, then exit.
 * For an external cron when the API process may be asleep:  npm run reminders
 */
import { prisma } from '../src/config/prisma.ts'
import { sendFollowUpReminders } from '../src/services/notifications.ts'

try {
  const sent = await sendFollowUpReminders()
  console.log(`Follow-up reminders sent: ${sent}`)
} finally {
  await prisma.$disconnect()
}
