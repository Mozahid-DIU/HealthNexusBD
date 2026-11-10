import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { OtpInput } from '../OtpInput'
import { TagInput } from '../TagInput'

function Otp({ onComplete }: { onComplete?: (c: string) => void }) {
  const [code, setCode] = useState('')
  return (
    <>
      <OtpInput value={code} onChange={setCode} label="Code" onComplete={onComplete} />
      <output>{code}</output>
    </>
  )
}

const box = (n: number) => screen.getByLabelText(`Code ${n}`)

describe('OtpInput', () => {
  it('advances while typing and reports the full code', async () => {
    const onComplete = vi.fn()
    render(<Otp onComplete={onComplete} />)

    await userEvent.click(box(1))
    await userEvent.keyboard('123456')

    expect(screen.getByRole('status')).toHaveTextContent('123456')
    expect(onComplete).toHaveBeenCalledWith('123456')
  })

  it('ignores letters', async () => {
    render(<Otp />)
    await userEvent.click(box(1))
    await userEvent.keyboard('1a2b')
    expect(screen.getByRole('status')).toHaveTextContent(/^12$/)
  })

  it('fills every box from a pasted code, stripping spaces and dashes', async () => {
    const onComplete = vi.fn()
    render(<Otp onComplete={onComplete} />)
    await userEvent.click(box(1))
    await userEvent.paste('12 34-56')
    expect(onComplete).toHaveBeenCalledWith('123456')
    expect(box(6)).toHaveValue('6')
  })

  it('backspace deletes back, and typing in a later empty box appends', async () => {
    render(<Otp />)
    await userEvent.click(box(1))
    await userEvent.keyboard('123')
    await userEvent.keyboard('{Backspace}') // box 4 is empty → removes "3"
    expect(screen.getByRole('status')).toHaveTextContent(/^12$/)
    expect(box(3)).toHaveFocus()

    await userEvent.click(box(6))
    await userEvent.keyboard('9')
    expect(screen.getByRole('status')).toHaveTextContent(/^129$/)
  })

  it('deletes when the keyboard only reports an emptied box (some Android keyboards)', async () => {
    render(<Otp />)
    await userEvent.click(box(1))
    await userEvent.keyboard('123')
    fireEvent.change(box(2), { target: { value: '' } })
    expect(screen.getByRole('status')).toHaveTextContent(/^13$/)
  })

  it('returns focus to the first box when the code is cleared after a wrong attempt', async () => {
    function Retry() {
      const [code, setCode] = useState('')
      return (
        <>
          <OtpInput value={code} onChange={setCode} label="Code" />
          <button type="button" onClick={() => setCode('')}>
            clear
          </button>
        </>
      )
    }
    render(<Retry />)
    await userEvent.click(box(1))
    await userEvent.keyboard('123456')
    expect(box(6)).toHaveFocus()
    // The parent clears the code (wrong code) while the user is still in the boxes.
    fireEvent.click(screen.getByRole('button', { name: 'clear' }))
    expect(box(1)).toHaveFocus()
  })
})

function Tags() {
  const [tags, setTags] = useState<string[]>(['fever'])
  return <TagInput label="Symptoms" value={tags} onChange={setTags} removeLabel={(t) => `Remove ${t}`} />
}

describe('TagInput', () => {
  it('adds on Enter and comma, skips duplicates, removes with Backspace or the x', async () => {
    render(<Tags />)
    const input = screen.getByLabelText('Symptoms')

    await userEvent.type(input, 'cough{Enter}Fever,headache,')
    expect(screen.getByRole('button', { name: 'Remove cough' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Remove headache' })).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: /Remove fever/i })).toHaveLength(1)

    await userEvent.keyboard('{Backspace}')
    expect(screen.queryByRole('button', { name: 'Remove headache' })).not.toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Remove fever' }))
    expect(screen.queryByRole('button', { name: 'Remove fever' })).not.toBeInTheDocument()
  })

  it('does not add a chip while an input method is still composing (e.g. Bangla)', () => {
    render(<Tags />)
    const input = screen.getByLabelText('Symptoms')
    fireEvent.change(input, { target: { value: 'জ্বর' } })
    fireEvent.keyDown(input, { key: 'Enter', isComposing: true })
    expect(screen.queryByRole('button', { name: 'Remove জ্বর' })).not.toBeInTheDocument()
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(screen.getByRole('button', { name: 'Remove জ্বর' })).toBeInTheDocument()
  })

  it('keeps an unfinished entry when the field loses focus', async () => {
    render(<Tags />)
    await userEvent.type(screen.getByLabelText('Symptoms'), 'rash')
    await userEvent.tab()
    expect(screen.getByRole('button', { name: 'Remove rash' })).toBeInTheDocument()
  })
})
