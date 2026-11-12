import { api, uploadFile } from '@/lib/api'
import type { PatientQuery } from '@/lib/identifier'
import type { LabSearchResult, LabUpload, UploadedReport } from './types'

export const PAGE_SIZE = 10

/** Query keys, all under 'lab'; each caches the full API envelope (screens `select`). */
export const labKeys = {
  all: ['lab'] as const,
  /** No argument: every search (for invalidation). */
  search: (q?: string) => (q === undefined ? (['lab', 'search'] as const) : (['lab', 'search', q] as const)),
  uploads: (page: number, limit: number) => ['lab', 'uploads', page, limit] as const,
  allUploads: () => ['lab', 'uploads'] as const,
}

const q = (params: Record<string, string>) => new URLSearchParams(params).toString()

export const labApi = {
  search: (query: PatientQuery) => api.get<LabSearchResult>(`/lab/search?${q(query)}`),
  uploads: (page: number, limit = PAGE_SIZE) =>
    api.get<LabUpload[]>(`/lab/uploads?${q({ page: String(page), limit: String(limit) })}`),
  file: (reportId: string) => api.blob(`/lab/reports/${encodeURIComponent(reportId)}/file`),
  upload: (input: { uhid: string; testName: string; file: File }) => {
    const form = new FormData()
    form.append('uhid', input.uhid)
    form.append('testName', input.testName)
    form.append('file', input.file)
    return uploadFile<UploadedReport>('/lab/reports', form)
  },
}
