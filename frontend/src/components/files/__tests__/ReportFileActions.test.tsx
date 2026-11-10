import { describe, expect, it, vi } from 'vitest'
import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ReportFileActions } from '../ReportFileActions'

describe('ReportFileActions', () => {
  it('frees the decrypted file when the viewer closes', async () => {
    const revoke = vi.spyOn(URL, 'revokeObjectURL')
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:one')
    render(<ReportFileActions title="CBC" fetchFile={async () => new Blob(['%PDF'])} />)

    await userEvent.click(screen.getByRole('button', { name: 'View: CBC' }))
    expect(await screen.findByRole('dialog', { name: 'CBC' })).toBeInTheDocument()
    await userEvent.keyboard('{Escape}')

    expect(revoke).toHaveBeenCalledWith('blob:one')
  })

  it('never keeps a file that arrives after the row is gone', async () => {
    const create = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:late')
    let resolve!: (b: Blob) => void
    const { unmount } = render(
      <ReportFileActions title="CBC" fetchFile={() => new Promise<Blob>((r) => (resolve = r))} />,
    )

    await userEvent.click(screen.getByRole('button', { name: 'View: CBC' }))
    unmount()
    await act(async () => resolve(new Blob(['%PDF'])))

    expect(create).not.toHaveBeenCalled()
  })
})
