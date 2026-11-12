import { useEffect } from 'react'
import { useQueryClient, type QueryKey } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import type { PatientQuery } from '@/lib/identifier'

/**
 * After a search by mobile number finds the patient, swap the number for their UHID in
 * the address bar (replacing the history entry), so a patient's phone number is not
 * left behind in the browser. The result is re-cached under the new key: no refetch.
 */
export function useUhidInUrl(q: string, query: PatientQuery | null, uhid: string | undefined, keyFor: (q: string) => QueryKey) {
  const queryClient = useQueryClient()
  const [, setParams] = useSearchParams()
  const byPhone = query !== null && 'phone' in query

  useEffect(() => {
    if (!uhid || !byPhone) return
    const cached = queryClient.getQueryData(keyFor(q))
    if (cached) queryClient.setQueryData(keyFor(uhid), cached)
    setParams({ q: uhid }, { replace: true })
  }, [uhid, byPhone, q, queryClient, setParams, keyFor])
}
