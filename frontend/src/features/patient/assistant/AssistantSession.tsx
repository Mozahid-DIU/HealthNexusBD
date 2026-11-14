import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import type { ChatAttachment } from '../types'
import { useAssistantChat } from './useAssistantChat'

const consentKey = (userId: string) => `healthnexus-assistant-consent:${userId}`

/** Remembered per account on this device (a convenience; the server also requires it). */
function readConsent(userId: string): boolean {
  try {
    return localStorage.getItem(consentKey(userId)) === 'yes'
  } catch {
    return false
  }
}

function saveConsent(userId: string) {
  try {
    localStorage.setItem(consentKey(userId), 'yes')
  } catch {
    // Private mode: they will simply be asked again next time.
  }
}

export interface AssistantSession {
  chat: ReturnType<typeof useAssistantChat>
  consented: boolean
  accept: () => void
  draft: string
  setDraft: (draft: string) => void
  attachment: ChatAttachment | null
  setAttachment: (attachment: ChatAttachment | null) => void
  /** Forget the conversation, the draft and the attachment. */
  newChat: () => void
}

const SessionContext = createContext<AssistantSession | null>(null)

/**
 * One conversation for the whole patient dashboard, so the corner panel and the full
 * page show the same chat and it survives moving between pages. It lives only in
 * memory: signing out or reloading ends it.
 */
export function AssistantSessionProvider({ userId, children }: { userId: string; children: ReactNode }) {
  const chat = useAssistantChat()
  const [consented, setConsented] = useState(() => readConsent(userId))
  const [draft, setDraft] = useState('')
  const [attachment, setAttachment] = useState<ChatAttachment | null>(null)
  const { reset } = chat

  const accept = useCallback(() => {
    saveConsent(userId)
    setConsented(true)
  }, [userId])

  const newChat = useCallback(() => {
    reset()
    setDraft('')
    setAttachment(null)
  }, [reset])

  const value = useMemo(
    () => ({ chat, consented, accept, draft, setDraft, attachment, setAttachment, newChat }),
    [chat, consented, accept, draft, attachment, newChat],
  )
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}

export function useAssistantSession(): AssistantSession {
  const session = useContext(SessionContext)
  if (!session) throw new Error('useAssistantSession needs an AssistantSessionProvider (the patient dashboard has one).')
  return session
}
