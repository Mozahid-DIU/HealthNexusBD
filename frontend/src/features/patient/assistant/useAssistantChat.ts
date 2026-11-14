import { useCallback, useRef, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useLanguage } from '@/i18n/useLanguage'
import { patientApi } from '../api'
import type { ChatAttachment, ChatTurn } from '../types'

/** Bounds the server enforces (16 turns, 16 000 characters); stay safely inside them. */
const MAX_TURNS = 14
const MAX_CHARS = 14_000
export const MAX_MESSAGE_CHARS = 2000

export interface ChatEntry {
  id: string
  role: 'user' | 'model'
  text: string
  /** User turn: what was shared with it. Model turn: what it explained. */
  attachment?: ChatAttachment | null
  emergency?: boolean
  /** Model turn: it mentions doses or stopping a medicine. */
  medicineCaution?: boolean
  /** Model turn: the server's signature, returned with it as history. */
  sig?: string
  /** A user turn that never got an answer (shown with a retry). */
  failed?: boolean
}

let counter = 0
const nextId = () => `m${++counter}`

/**
 * The turns sent for an answer: the newest that fit the server's limits, starting with
 * the patient (the model expects a conversation to open with the user).
 */
export function turnsToSend(entries: ChatEntry[]): { turns: ChatTurn[]; trimmed: boolean } {
  const answered = entries.filter((e) => !e.failed || e === entries[entries.length - 1])
  const turns: ChatTurn[] = []
  let chars = 0
  for (let i = answered.length - 1; i >= 0; i--) {
    const e = answered[i]!
    if (turns.length >= MAX_TURNS || chars + e.text.length > MAX_CHARS) break
    turns.unshift(e.role === 'model' ? { role: 'model', text: e.text, sig: e.sig } : { role: 'user', text: e.text })
    chars += e.text.length
  }
  while (turns.length > 1 && turns[0]!.role !== 'user') turns.shift()
  return { turns, trimmed: turns.length < answered.length }
}

/** A Health Assistant conversation. It lives only in this page's memory: nothing is saved. */
export function useAssistantChat() {
  const lang = useLanguage()
  const [entries, setEntries] = useState<ChatEntry[]>([])
  const [trimmed, setTrimmed] = useState(false)
  // Ignore an answer that arrives after "New chat".
  const generation = useRef(0)

  const mutation = useMutation({
    mutationFn: (vars: { turns: ChatTurn[]; attachment?: ChatAttachment | null; generation: number }) =>
      patientApi.assistantChat({
        lang,
        messages: vars.turns,
        ...(vars.attachment ? { attachment: { kind: vars.attachment.kind, id: vars.attachment.id } } : {}),
      }),
    onSuccess: ({ data }, vars) => {
      if (vars.generation !== generation.current) return
      // An earlier unanswered question stays marked: it was never part of this answer.
      setEntries((prev) => [
        ...prev,
        {
          id: nextId(),
          role: 'model',
          text: data.reply,
          sig: data.sig,
          emergency: data.emergency,
          medicineCaution: data.medicineCaution,
          attachment: data.attachment,
        },
      ])
    },
    onError: (_err, vars) => {
      if (vars.generation !== generation.current) return
      setEntries((prev) => prev.map((e, i) => (i === prev.length - 1 && e.role === 'user' ? { ...e, failed: true } : e)))
    },
  })

  const ask = useCallback(
    (all: ChatEntry[], attachment?: ChatAttachment | null) => {
      const { turns, trimmed: cut } = turnsToSend(all)
      setTrimmed(cut)
      mutation.mutate({ turns, attachment, generation: generation.current })
    },
    [mutation],
  )

  const send = useCallback(
    (text: string, attachment?: ChatAttachment | null) => {
      const clean = text.trim().slice(0, MAX_MESSAGE_CHARS)
      if (!clean || mutation.isPending) return
      const next = [...entries, { id: nextId(), role: 'user' as const, text: clean, attachment: attachment ?? null }]
      setEntries(next)
      ask(next, attachment)
    },
    [ask, entries, mutation.isPending],
  )

  /** Resend the last unanswered question (with its attachment). */
  const retry = useCallback(() => {
    const last = entries[entries.length - 1]
    if (!last?.failed || mutation.isPending) return
    const next = entries.map((e) => (e === last ? { ...e, failed: false } : e))
    setEntries(next)
    ask(next, last.attachment)
  }, [ask, entries, mutation.isPending])

  const reset = useCallback(() => {
    generation.current += 1
    mutation.reset()
    setEntries([])
    setTrimmed(false)
  }, [mutation])

  return { entries, send, retry, reset, pending: mutation.isPending, error: mutation.error, trimmed }
}
