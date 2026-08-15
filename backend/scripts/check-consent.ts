/**
 * Manual sanity check for the Consent + OTP engine.
 *
 * Self-contained: it boots the app on an internal port, plays the full
 * doctor <-> patient OTP flow, prints every step (including the real OTP so you
 * can see it flow through), then cleans up after itself.
 *
 * Run:  npm run check:consent
 * Needs: OTP_MODE=demo in .env (so the code is returned instead of SMS-only).
 */
// Quiet the app's request logging so the step-by-step output stays readable.
// Must be set before the app (and its logger) is loaded, so the app modules are
// imported dynamically inside main() rather than statically at the top.
process.env.LOG_LEVEL = 'silent'

import type { Server } from 'node:http'

let createApp: (typeof import('../src/app.ts'))['createApp']
let prisma: (typeof import('../src/config/prisma.ts'))['prisma']
let env: (typeof import('../src/config/env.ts'))['env']

const PORT = 4100
const BASE = `http://localhost:${PORT}/api`
const uniq = Date.now().toString().slice(-6)
const patientEmail = `check.pat.${uniq}@hn.bd`
const doctorEmail = `check.doc.${uniq}@hn.bd`
const BMDC = 'A-27654' // valid, unclaimed registry number

function line(msg = '') {
  console.log(msg)
}
function step(n: number, msg: string) {
  console.log(`\n\x1b[36m${n}) ${msg}\x1b[0m`)
}
function ok(msg: string) {
  console.log(`   \x1b[32m✔\x1b[0m ${msg}`)
}
function info(label: string, value: string) {
  console.log(`   \x1b[33m${label}:\x1b[0m ${value}`)
}

async function api(method: string, path: string, body?: unknown, token?: string) {
  const res = await fetch(BASE + path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  })
  return { status: res.status, json: (await res.json().catch(() => ({}))) as any }
}

function listen(): Promise<Server> {
  const app = createApp()
  return new Promise((resolve) => {
    const server = app.listen(PORT, () => resolve(server))
  })
}

async function cleanup() {
  const users = await prisma.user.findMany({
    where: { email: { in: [patientEmail, doctorEmail] } },
    select: { id: true },
  })
  const ids = users.map((u) => u.id)
  if (ids.length) {
    const pats = await prisma.patient.findMany({
      where: { userId: { in: ids } },
      select: { id: true },
    })
    await prisma.auditLog.deleteMany({ where: { actorUserId: { in: ids } } })
    if (pats.length) {
      await prisma.auditLog.deleteMany({ where: { patientId: { in: pats.map((p) => p.id) } } })
    }
    await prisma.user.deleteMany({ where: { id: { in: ids } } })
  }
  await prisma.doctorRegistry.updateMany({
    where: { bmdcNumber: BMDC },
    data: { isClaimed: false, claimedByUserId: null },
  })
}

async function main() {
  // Load app modules now that LOG_LEVEL is set.
  ;({ createApp } = await import('../src/app.ts'))
  ;({ prisma } = await import('../src/config/prisma.ts'))
  ;({ env } = await import('../src/config/env.ts'))

  if (env.OTP_MODE !== 'demo') {
    line('⚠  OTP_MODE is not "demo" — the code will be sent by SMS and not shown here.')
  }

  const server = await listen()
  line('\n══════════ Consent + OTP — live check ══════════')

  try {
    // Setup
    const pReg = await api('POST', '/auth/register', {
      role: 'patient',
      email: patientEmail,
      phone: `018${uniq}0011`.slice(0, 11),
      password: 'Test@1234',
      nid: `19900${uniq}789`,
      fullName: 'Demo Patient',
    })
    const patientToken = pReg.json?.data?.accessToken
    const uhid = pReg.json?.data?.user?.patient?.uhid

    const dReg = await api('POST', '/auth/register', {
      role: 'doctor',
      email: doctorEmail,
      phone: `017${uniq}0022`.slice(0, 11),
      password: 'Test@1234',
      bmdcNumber: BMDC,
      fullName: 'ignored',
    })
    const doctorToken = dReg.json?.data?.accessToken
    // Simulate admin verifying the doctor so they may request access.
    await prisma.user.update({ where: { email: doctorEmail }, data: { status: 'active' } })

    step(1, 'A patient and a verified doctor exist')
    info('Patient UHID', uhid)
    info('Doctor', `Dr. Imran Kabir (BMDC ${BMDC})`)

    step(2, 'Doctor requests access to the patient by UHID')
    const req = await api(
      'POST',
      '/consent/request',
      { uhid, reason: 'Follow-up consultation' },
      doctorToken,
    )
    const requestId = req.json?.data?.requestId
    const otp = req.json?.data?.devOtp
    ok(`request accepted (HTTP ${req.status})`)
    info('OTP sent to patient phone', `\x1b[1m${otp}\x1b[0m  (demo mode → shown here)`)

    step(3, 'Patient sees the pending request on their dashboard')
    const act = await api('GET', '/consent/requests', undefined, patientToken)
    const pend = act.json?.data?.pendingRequests?.[0]
    ok(`patient has ${act.json?.data?.pendingRequests?.length} pending request`)
    info('From', `${pend?.doctor?.fullName} — ${pend?.doctor?.specialization}`)
    info('Reason', pend?.reason)

    step(4, 'Try a WRONG code first')
    const wrong = await api(
      'POST',
      '/consent/verify',
      { requestId, code: otp === '000000' ? '111111' : '000000' },
      doctorToken,
    )
    ok(`rejected as expected (HTTP ${wrong.status}) → "${wrong.json?.error}"`)

    step(5, `Doctor submits the CORRECT code (${otp})`)
    const ver = await api('POST', '/consent/verify', { requestId, code: otp }, doctorToken)
    if (ver.status === 201) {
      ok(`OTP passed ✅  access session created (HTTP ${ver.status})`)
      info('Session id', ver.json?.data?.sessionId)
      info('Expires at', new Date(ver.json?.data?.expiresAt).toLocaleString())
    } else {
      console.log(`   \x1b[31m✗ OTP did NOT pass (HTTP ${ver.status}): ${ver.json?.error}\x1b[0m`)
    }

    step(6, 'Doctor now has live access; patient can revoke anytime')
    const sess = await api('GET', '/consent/sessions', undefined, doctorToken)
    ok(`doctor active sessions: ${sess.json?.data?.length}`)
    const sessionId = ver.json?.data?.sessionId
    const rev = await api('POST', `/consent/sessions/${sessionId}/revoke`, undefined, patientToken)
    ok(`patient revoked (HTTP ${rev.status})`)
    const after = await api('GET', '/consent/sessions', undefined, doctorToken)
    ok(`doctor active sessions after revoke: ${after.json?.data?.length}`)

    const verdict = ver.status === 201 && wrong.status === 400
    line(
      `\n${verdict ? '\x1b[32m✅ OTP flow works end-to-end.\x1b[0m' : '\x1b[31m❌ Something is off — see above.\x1b[0m'}`,
    )
  } finally {
    await cleanup()
    line('\n(cleaned up test accounts)\n')
    server.close()
    await prisma.$disconnect()
  }
}

main().catch(async (err) => {
  console.error('FATAL', err)
  await prisma?.$disconnect()
  process.exit(1)
})
