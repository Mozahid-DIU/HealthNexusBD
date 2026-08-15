/**
 * Pagination helper shared by all list endpoints.
 * Clamps to safe bounds and returns Prisma-ready { skip, take } plus echo values.
 */

const DEFAULT_LIMIT = 20
const MAX_LIMIT = 100

export interface PageParams {
  page: number
  limit: number
  skip: number
  take: number
}

export function getPagination(query: { page?: number; limit?: number }): PageParams {
  const page = Math.max(1, query.page ?? 1)
  const limit = Math.min(MAX_LIMIT, Math.max(1, query.limit ?? DEFAULT_LIMIT))
  return { page, limit, skip: (page - 1) * limit, take: limit }
}
