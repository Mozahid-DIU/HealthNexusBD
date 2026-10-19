import { describe, expect, it } from 'vitest'
import { fromState, routeForUser } from '../redirect'
import type { AuthUser } from '@/types/api'

const patient = { id: '1', email: 'a@b.bd', phone: '01711111111', role: 'patient', status: 'active' } as AuthUser

describe('routeForUser', () => {
  it('returns to a page in the user’s own section, query string included', () => {
    expect(routeForUser(patient, '/patient')).toBe('/patient')
    expect(routeForUser(patient, '/patient/records?page=2')).toBe('/patient/records?page=2')
    expect(routeForUser(patient, '/patient?tab=active')).toBe('/patient?tab=active')
  })

  it('never redirects outside the user’s section (no open redirect)', () => {
    for (const from of ['/admin', '/patientx', '//evil.example', 'https://evil.example/patient', '/doctor/patient', undefined, 42]) {
      expect(routeForUser(patient, from)).toBe('/patient')
    }
  })

  it('reads `from` defensively from router state', () => {
    expect(fromState({ from: '/patient' })).toBe('/patient')
    expect(fromState({ from: 5 })).toBeUndefined()
    expect(fromState(null)).toBeUndefined()
    expect(fromState('x')).toBeUndefined()
  })
})
