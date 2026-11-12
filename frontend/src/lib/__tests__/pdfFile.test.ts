import { describe, expect, it } from 'vitest'
import { checkPdf, MAX_REPORT_MB } from '../pdfFile'

const pdf = (body = '%PDF-1.4\n...', name = 'report.pdf', type = 'application/pdf') => new File([body], name, { type })

describe('checkPdf', () => {
  it('accepts a real PDF', async () => {
    expect(await checkPdf(pdf())).toBeNull()
  })

  it('accepts a PDF whose browser-reported type is missing (some Windows setups)', async () => {
    expect(await checkPdf(pdf('%PDF-1.7', 'scan.PDF', ''))).toBeNull()
  })

  it('rejects a file that only claims to be a PDF', async () => {
    expect(await checkPdf(pdf('MZ not really', 'report.pdf'))).toEqual({ key: 'files.notPdf' })
  })

  it('rejects other file types without reading them', async () => {
    expect(await checkPdf(pdf('%PDF-', 'photo.jpg', 'image/jpeg'))).toEqual({ key: 'files.notPdf' })
  })

  it('rejects an empty file', async () => {
    expect(await checkPdf(pdf(''))).toEqual({ key: 'files.empty' })
  })

  it('rejects a file over the limit, saying how big it is', async () => {
    const big = new File([new Uint8Array(MAX_REPORT_MB * 1024 * 1024 + 1)], 'big.pdf', { type: 'application/pdf' })
    expect(await checkPdf(big)).toEqual({ key: 'files.tooLarge', bytes: big.size })
  })
})
