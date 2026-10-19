import request from 'supertest'
import { beforeAll, describe, expect, it } from 'vitest'
import { createApp } from '../../src/app.ts'
import { resetDb } from '../helpers/db.ts'
import { createAdmin, createDoctor, createLab, createPatient } from '../helpers/factories.ts'

type Role = 'patient' | 'doctor' | 'lab' | 'admin'

const app = createApp()
const auth = {} as Record<Role, string>

beforeAll(async () => {
  await resetDb()
  auth.patient = (await createPatient()).auth
  auth.doctor = (await createDoctor()).auth
  auth.lab = (await createLab()).auth
  auth.admin = (await createAdmin()).auth
})

/** Every protected route, with the only role allowed to use it. */
const ROUTES: Array<{ method: 'get' | 'post'; path: string; role: Role }> = [
  { method: 'get', path: '/api/patient/profile', role: 'patient' },
  { method: 'get', path: '/api/patient/records', role: 'patient' },
  { method: 'get', path: '/api/patient/lab-reports', role: 'patient' },
  { method: 'get', path: '/api/patient/audit', role: 'patient' },
  { method: 'get', path: '/api/consent/requests', role: 'patient' },
  { method: 'get', path: '/api/patient/notifications', role: 'patient' },
  { method: 'post', path: '/api/patient/notifications/read-all', role: 'patient' },
  { method: 'get', path: '/api/doctor/patients', role: 'doctor' },
  { method: 'get', path: '/api/doctor/patients/00000000-0000-0000-0000-000000000000/lab-reports', role: 'doctor' },
  { method: 'get', path: '/api/doctor/search?uhid=BD-2026-00001', role: 'doctor' },
  { method: 'post', path: '/api/doctor/records', role: 'doctor' },
  { method: 'get', path: '/api/consent/sessions', role: 'doctor' },
  { method: 'post', path: '/api/consent/request', role: 'doctor' },
  { method: 'get', path: '/api/lab/uploads', role: 'lab' },
  { method: 'get', path: '/api/lab/search?uhid=BD-2026-00001', role: 'lab' },
  { method: 'post', path: '/api/lab/reports', role: 'lab' },
  { method: 'get', path: '/api/admin/dashboard', role: 'admin' },
  { method: 'get', path: '/api/admin/doctors', role: 'admin' },
  { method: 'get', path: '/api/admin/labs', role: 'admin' },
  { method: 'get', path: '/api/admin/users', role: 'admin' },
  { method: 'get', path: '/api/admin/audit', role: 'admin' },
]

const ROLES: Role[] = ['patient', 'doctor', 'lab', 'admin']

describe('role-based access control', () => {
  describe.each(ROUTES)('$method $path ($role only)', ({ method, path, role }) => {
    it('returns 401 without a token', async () => {
      expect((await request(app)[method](path)).status).toBe(401)
    })

    it.each(ROLES.filter((r) => r !== role))('returns 403 for a %s', async (other) => {
      const res = await request(app)[method](path).set('Authorization', auth[other])
      expect(res.status).toBe(403)
    })
  })

  it('lets each role into its own GET routes', async () => {
    for (const { method, path, role } of ROUTES) {
      // Search needs a real match and per-patient routes need consent; both are tested elsewhere.
      if (method !== 'get' || path.includes('search') || path.includes('/patients/0000')) continue
      const res = await request(app).get(path).set('Authorization', auth[role])
      expect(res.status, `${role} → ${path}`).toBe(200)
    }
  })
})
