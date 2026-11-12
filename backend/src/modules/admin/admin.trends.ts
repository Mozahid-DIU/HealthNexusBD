import { prisma } from '../../config/prisma.ts'

/**
 * Day-by-day platform activity for the admin charts. Days are Dhaka calendar days
 * (UTC+6, no daylight saving), which is how the admin reads "today".
 */

const DAY_MS = 86_400_000
const DHAKA_OFFSET = '+06:00'

export const TREND_METRICS = ['patients', 'doctors', 'labs', 'records', 'labReports', 'consents'] as const
type Metric = (typeof TREND_METRICS)[number]
export type TrendPoint = { date: string } & Record<Metric, number>
type Totals = Record<Metric, number>

const dhakaDay = (d: Date) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Dhaka' }).format(d)

/** The last `count` Dhaka days as YYYY-MM-DD, oldest first, ending today. */
function lastDays(count: number, now: Date): string[] {
  const today = Date.parse(`${dhakaDay(now)}T00:00:00Z`)
  return Array.from({ length: count }, (_, i) => new Date(today - (count - 1 - i) * DAY_MS).toISOString().slice(0, 10))
}

const emptyTotals = (): Totals => ({ patients: 0, doctors: 0, labs: 0, records: 0, labReports: 0, consents: 0 })

type Row = { day: string; n: number }
type RoleRow = Row & { role: 'patient' | 'doctor' | 'lab' }

/** Counts per Dhaka day since `from`, one grouped query per table (all parameterised). */
async function countsSince(from: Date) {
  const [accounts, records, labReports, consents] = await Promise.all([
    prisma.$queryRaw<RoleRow[]>`
      SELECT to_char(created_at AT TIME ZONE 'Asia/Dhaka', 'YYYY-MM-DD') AS day, role::text AS role, count(*)::int AS n
      FROM users WHERE created_at >= ${from} AND role <> 'admin' GROUP BY 1, 2`,
    prisma.$queryRaw<Row[]>`
      SELECT to_char(created_at AT TIME ZONE 'Asia/Dhaka', 'YYYY-MM-DD') AS day, count(*)::int AS n
      FROM medical_records WHERE created_at >= ${from} GROUP BY 1`,
    prisma.$queryRaw<Row[]>`
      SELECT to_char(uploaded_at AT TIME ZONE 'Asia/Dhaka', 'YYYY-MM-DD') AS day, count(*)::int AS n
      FROM lab_reports WHERE uploaded_at >= ${from} GROUP BY 1`,
    prisma.$queryRaw<Row[]>`
      SELECT to_char(granted_at AT TIME ZONE 'Asia/Dhaka', 'YYYY-MM-DD') AS day, count(*)::int AS n
      FROM access_sessions WHERE granted_at >= ${from} GROUP BY 1`,
  ])
  return { accounts, records, labReports, consents }
}

const ROLE_METRIC = { patient: 'patients', doctor: 'doctors', lab: 'labs' } as const

/**
 * `days` points ending today, plus totals for this period and the one before it (so
 * the dashboard can say "+12% vs the previous 30 days").
 */
export async function getTrends(days: number, now: Date = new Date()) {
  const keys = lastDays(days * 2, now)
  const byDay = new Map<string, TrendPoint>(keys.map((date) => [date, { date, ...emptyTotals() }]))
  const add = (day: string, metric: Metric, n: number) => {
    const point = byDay.get(day)
    if (point) point[metric] += n
  }

  const counts = await countsSince(new Date(`${keys[0]}T00:00:00${DHAKA_OFFSET}`))
  for (const r of counts.accounts) add(r.day, ROLE_METRIC[r.role], r.n)
  for (const r of counts.records) add(r.day, 'records', r.n)
  for (const r of counts.labReports) add(r.day, 'labReports', r.n)
  for (const r of counts.consents) add(r.day, 'consents', r.n)

  const points = keys.map((k) => byDay.get(k)!)
  const sum = (slice: TrendPoint[]) =>
    slice.reduce((acc, p) => {
      for (const m of TREND_METRICS) acc[m] += p[m]
      return acc
    }, emptyTotals())

  return {
    days,
    series: points.slice(days),
    totals: { current: sum(points.slice(days)), previous: sum(points.slice(0, days)) },
  }
}
