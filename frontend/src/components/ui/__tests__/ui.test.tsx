import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ConfirmDialog, Modal } from '../Modal'
import { Tabs } from '../Tabs'
import { Pagination } from '../Pagination'
import { Toaster } from '../Toaster'
import { ErrorState } from '../Feedback'
import { toast, useToastStore } from '@/stores/toast'
import { ApiError } from '@/lib/api'
import { i18n } from '@/i18n'

function ModalHarness({ dismissible = true }: { dismissible?: boolean }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button onClick={() => setOpen(true)}>Open</button>
      <Modal open={open} onClose={() => setOpen(false)} title="Edit profile" dismissible={dismissible}>
        <input aria-label="First" />
        <input aria-label="Last" />
      </Modal>
    </>
  )
}

describe('Modal', () => {
  it('moves focus in, traps Tab, closes on Escape and restores focus', async () => {
    render(<ModalHarness />)
    const trigger = screen.getByRole('button', { name: 'Open' })
    await userEvent.click(trigger)

    const dialog = screen.getByRole('dialog', { name: 'Edit profile' })
    expect(dialog).toHaveAttribute('aria-modal', 'true')
    expect(screen.getByRole('button', { name: 'Close' })).toHaveFocus()

    await userEvent.tab()
    await userEvent.tab()
    expect(screen.getByLabelText('Last')).toHaveFocus()
    await userEvent.tab() // wraps around
    expect(screen.getByRole('button', { name: 'Close' })).toHaveFocus()
    await userEvent.tab({ shift: true }) // and backwards
    expect(screen.getByLabelText('Last')).toHaveFocus()

    await userEvent.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(trigger).toHaveFocus()
  })

  it('cannot be dismissed while busy', async () => {
    render(<ModalHarness dismissible={false} />)
    await userEvent.click(screen.getByRole('button', { name: 'Open' }))

    await userEvent.keyboard('{Escape}')

    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Close' })).not.toBeInTheDocument()
  })
})

function StackedHarness() {
  const [outer, setOuter] = useState(true)
  const [inner, setInner] = useState(true)
  return (
    <>
      <Modal open={outer} onClose={() => setOuter(false)} title="Outer" />
      <Modal open={inner} onClose={() => setInner(false)} title="Inner" />
    </>
  )
}

describe('stacked dialogs', () => {
  it('Escape closes only the top dialog, and scroll unlocks after the last one', async () => {
    render(<StackedHarness />)
    expect(document.body.style.overflow).toBe('hidden')

    await userEvent.keyboard('{Escape}')
    expect(screen.queryByRole('dialog', { name: 'Inner' })).not.toBeInTheDocument()
    expect(screen.getByRole('dialog', { name: 'Outer' })).toBeInTheDocument()
    expect(document.body.style.overflow).toBe('hidden')

    await userEvent.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(document.body.style.overflow).toBe('')
  })
})

describe('ConfirmDialog', () => {
  it('confirms, cancels, and locks while busy', async () => {
    const onConfirm = vi.fn()
    const onCancel = vi.fn()
    const { rerender } = render(
      <ConfirmDialog open title="Revoke access?" confirmLabel="Revoke" onConfirm={onConfirm} onCancel={onCancel} tone="danger" />,
    )
    await userEvent.click(screen.getByRole('button', { name: 'Revoke' }))
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(onConfirm).toHaveBeenCalledTimes(1)
    expect(onCancel).toHaveBeenCalledTimes(1)

    rerender(
      <ConfirmDialog open busy title="Revoke access?" confirmLabel="Revoke" onConfirm={onConfirm} onCancel={onCancel} />,
    )
    expect(screen.getByRole('button', { name: 'Loading…' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled()
  })
})

function TabsHarness() {
  const [value, setValue] = useState<'a' | 'b' | 'c'>('a')
  return (
    <Tabs
      label="Sections"
      value={value}
      onChange={setValue}
      tabs={[
        { id: 'a', label: 'Pending', count: 2 },
        { id: 'b', label: 'Active' },
        { id: 'c', label: 'History' },
      ]}
    >
      <p>Panel {value}</p>
    </Tabs>
  )
}

describe('Tabs', () => {
  it('selects with click and arrow keys, wrapping around', async () => {
    render(<TabsHarness />)
    expect(screen.getByRole('tab', { name: /Pending/ })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Panel a')

    await userEvent.click(screen.getByRole('tab', { name: 'Active' }))
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Panel b')

    await userEvent.keyboard('{ArrowRight}')
    expect(screen.getByRole('tab', { name: 'History' })).toHaveFocus()
    await userEvent.keyboard('{ArrowRight}')
    expect(screen.getByRole('tab', { name: /Pending/ })).toHaveAttribute('aria-selected', 'true')
    await userEvent.keyboard('{End}')
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Panel c')
  })
})

describe('Pagination', () => {
  it('hides itself for a single page', () => {
    const { container } = render(<Pagination meta={{ total: 5, page: 1, limit: 20 }} onPageChange={() => {}} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('pages forward and back, disabling at the ends, in Bangla digits too', async () => {
    const onPageChange = vi.fn()
    const { rerender } = render(<Pagination meta={{ total: 45, page: 1, limit: 20 }} onPageChange={onPageChange} />)
    expect(screen.getByText('Page 1 of 3')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Previous' })).toBeDisabled()

    await userEvent.click(screen.getByRole('button', { name: 'Next' }))
    expect(onPageChange).toHaveBeenCalledWith(2)

    await act(() => i18n.changeLanguage('bn'))
    rerender(<Pagination meta={{ total: 45, page: 3, limit: 20 }} onPageChange={onPageChange} />)
    expect(screen.getByText('পৃষ্ঠা ৩ / ৩')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'পরের' })).toBeDisabled()
  })
})

describe('Toaster', () => {
  it('shows, dismisses, and auto-hides toasts', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    useToastStore.setState({ toasts: [] })
    render(<Toaster />)

    act(() => {
      toast.success('Saved')
      toast.error('Failed')
    })
    expect(screen.getByRole('status')).toHaveTextContent('Saved')
    expect(screen.getByRole('alert')).toHaveTextContent('Failed')

    const failed = screen.getByText('Failed').closest('li')!
    await userEvent.click(within(failed).getByRole('button', { name: 'Dismiss' }))
    expect(screen.queryByText('Failed')).not.toBeInTheDocument()

    act(() => {
      vi.advanceTimersByTime(4100)
    })
    expect(screen.queryByText('Saved')).not.toBeInTheDocument()
    vi.useRealTimers()
  })

  it('pauses auto-dismiss while hovered', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    useToastStore.setState({ toasts: [] })
    render(<Toaster />)
    act(() => {
      toast.info('Read me slowly')
    })

    await userEvent.hover(screen.getByText('Read me slowly'))
    act(() => {
      vi.advanceTimersByTime(10_000)
    })
    expect(screen.getByText('Read me slowly')).toBeInTheDocument()

    await userEvent.unhover(screen.getByText('Read me slowly'))
    act(() => {
      vi.advanceTimersByTime(5100)
    })
    expect(screen.queryByText('Read me slowly')).not.toBeInTheDocument()
    vi.useRealTimers()
  })

  it('keeps at most four toasts', () => {
    useToastStore.setState({ toasts: [] })
    for (let i = 0; i < 6; i++) toast.info(`n${i}`)
    expect(useToastStore.getState().toasts.map((t) => t.message)).toEqual(['n2', 'n3', 'n4', 'n5'])
  })
})

describe('ErrorState', () => {
  it('shows the translated reason and retries', async () => {
    const onRetry = vi.fn()
    render(<ErrorState error={new ApiError('errors.network', 0, 'NETWORK')} onRetry={onRetry} />)

    expect(screen.getByRole('alert')).toHaveTextContent('Cannot reach the server')
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }))
    expect(onRetry).toHaveBeenCalled()
  })
})
