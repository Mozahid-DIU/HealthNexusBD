import { afterEach, describe, expect, it, vi } from 'vitest'

const sendFollowUpReminders = vi.fn(async () => 0)
vi.mock('../../src/services/notifications.ts', () => ({ sendFollowUpReminders }))

const { startReminderScheduler, REMINDER_INTERVAL_MS } = await import('../../src/jobs/reminderScheduler.ts')

afterEach(() => {
  vi.useRealTimers()
  sendFollowUpReminders.mockReset()
})

describe('follow-up reminder scheduler', () => {
  it('runs once at startup and then every interval until stopped', async () => {
    vi.useFakeTimers()
    const stop = startReminderScheduler()
    await vi.advanceTimersByTimeAsync(0)
    expect(sendFollowUpReminders).toHaveBeenCalledTimes(1)

    await vi.advanceTimersByTimeAsync(REMINDER_INTERVAL_MS * 2)
    expect(sendFollowUpReminders).toHaveBeenCalledTimes(3)

    stop()
    await vi.advanceTimersByTimeAsync(REMINDER_INTERVAL_MS * 3)
    expect(sendFollowUpReminders).toHaveBeenCalledTimes(3)
  })

  it('survives a failing run and tries again next time', async () => {
    vi.useFakeTimers()
    sendFollowUpReminders.mockRejectedValueOnce(new Error('db down'))
    const stop = startReminderScheduler()

    await vi.advanceTimersByTimeAsync(REMINDER_INTERVAL_MS)

    expect(sendFollowUpReminders).toHaveBeenCalledTimes(2)
    stop()
  })
})
