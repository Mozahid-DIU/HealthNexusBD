import { useState } from 'react'
import { describe, expect, it } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PdfDropzone } from '../PdfDropzone'

function Harness() {
  const [file, setFile] = useState<File | null>(null)
  return <PdfDropzone file={file} onChange={setFile} />
}

const pdf = (name = 'cbc.pdf') => new File(['%PDF-1.4 report'], name, { type: 'application/pdf' })

describe('PdfDropzone', () => {
  it('announces the chosen file and keeps keyboard focus on the dropzone', async () => {
    render(<Harness />)
    await userEvent.upload(screen.getByLabelText('Choose a PDF'), pdf())

    const remove = await screen.findByRole('button', { name: 'Remove cbc.pdf' })
    await waitFor(() => expect(remove).toHaveFocus())
    expect(screen.getByRole('status')).toHaveTextContent('Selected: cbc.pdf')

    await userEvent.click(remove)
    await waitFor(() => expect(screen.getByLabelText('Choose a PDF')).toHaveFocus())
  })

  it('accepts a dropped file and ignores drops while disabled', async () => {
    const { rerender } = render(<PdfDropzone file={null} onChange={() => {}} disabled />)
    const zone = screen.getByText('Drag the PDF here').closest('label')!
    fireEvent.drop(zone, { dataTransfer: { files: [pdf()] } })
    expect(screen.queryByRole('status')).toHaveTextContent('')

    rerender(<Harness />)
    fireEvent.drop(screen.getByText('Drag the PDF here').closest('label')!, { dataTransfer: { files: [pdf('drop.pdf')] } })
    expect(await screen.findByRole('button', { name: 'Remove drop.pdf' })).toBeInTheDocument()
  })

  it('keeps a file dropped beside the zone from opening in the browser', () => {
    render(<Harness />)
    const event = new Event('drop', { bubbles: true, cancelable: true })
    window.dispatchEvent(event)
    expect(event.defaultPrevented).toBe(true)
  })
})
