/** Must match the backend's MAX_UPLOAD_MB. */
export const MAX_REPORT_MB = 10

const PDF_MAGIC = '%PDF-'

export type PdfProblem =
  | { key: 'files.notPdf' }
  | { key: 'files.empty' }
  | { key: 'files.tooLarge'; bytes: number }

/**
 * Check a chosen file before uploading, so the lab hears about a wrong file at once
 * instead of after a slow upload. Looks at the real first bytes, not just the name,
 * just like the server does.
 */
export async function checkPdf(file: File): Promise<PdfProblem | null> {
  const looksLikePdf = file.type === 'application/pdf' || (file.type === '' && /\.pdf$/i.test(file.name))
  if (!looksLikePdf) return { key: 'files.notPdf' }
  if (file.size === 0) return { key: 'files.empty' }
  if (file.size > MAX_REPORT_MB * 1024 * 1024) return { key: 'files.tooLarge', bytes: file.size }

  const head = new TextDecoder().decode(await file.slice(0, PDF_MAGIC.length).arrayBuffer())
  return head === PDF_MAGIC ? null : { key: 'files.notPdf' }
}
