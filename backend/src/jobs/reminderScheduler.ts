import { sendFollowUpReminders } from '../services/notifications.ts'
import { logger } from '../utils/logger.ts'

/** Hourly is enough: reminders are due from 9am the day before, and each is sent once. */
export const REMINDER_INTERVAL_MS = 60 * 60 * 1000

/**
 * Run follow-up reminders now and then every hour, inside the API process.
 * Returns a stop function. A failing run is logged and retried on the next tick.
 *
 * On hosts that sleep idle processes (e.g. free tiers), also schedule
 * `npm run reminders` with an external cron so reminders still go out.
 */
export function startReminderScheduler(): () => void {
  const run = async () => {
    try {
      await sendFollowUpReminders()
    } catch (err) {
      logger.error({ err }, 'Follow-up reminder run failed')
    }
  }

  void run()
  const timer = setInterval(() => void run(), REMINDER_INTERVAL_MS)
  // Never keep the process alive just for this timer.
  timer.unref()
  return () => clearInterval(timer)
}
