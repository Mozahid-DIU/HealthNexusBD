import { useCallback, useEffect } from 'react'
import type { PaginationMeta } from '@/types/api'
import { useSearchParams } from 'react-router-dom'

/** The current list page, kept in the URL (?page=2) so reloads and shared links keep it. */
export function usePageParam(): [number, (page: number, replace?: boolean) => void] {
  const [params, setParams] = useSearchParams()
  const raw = Number(params.get('page'))
  const page = Number.isInteger(raw) && raw > 0 ? raw : 1

  const setPage = useCallback(
    (next: number, replace = false) => {
      setParams(
        (prev) => {
          const copy = new URLSearchParams(prev)
          if (next <= 1) copy.delete('page')
          else copy.set('page', String(next))
          return copy
        },
        { replace },
      )
      window.scrollTo({ top: 0 })
    },
    [setParams],
  )

  return [page, setPage]
}

/**
 * If the URL points past the last page (an old link, or the last item was removed),
 * jump to the last page that exists instead of showing an empty list with no way back.
 */
export function useClampPage(
  page: number,
  meta: PaginationMeta | undefined,
  setPage: (page: number, replace?: boolean) => void,
) {
  useEffect(() => {
    if (!meta || page <= 1) return
    const last = Math.max(1, Math.ceil(meta.total / Math.max(1, meta.limit)))
    if (page > last) setPage(last, true)
  }, [page, meta, setPage])
}
