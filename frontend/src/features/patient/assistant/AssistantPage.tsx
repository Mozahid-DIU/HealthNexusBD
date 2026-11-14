import { useTranslation } from 'react-i18next'
import { Plus } from 'lucide-react'
import { PageHeader } from '@/components/layout/dashboard/PageHeader'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { AssistantConversation } from './AssistantConversation'
import { useAssistantSession } from './AssistantSession'

/** The patient's Health Assistant: plain-language answers about their health and records. */
export function AssistantPage() {
  const { t } = useTranslation()
  const { chat, consented, newChat } = useAssistantSession()

  return (
    <>
      <PageHeader
        title={
          <span className="inline-flex items-center gap-2.5">
            {t('patient.assistant.title')}
            <Badge tone="brand">{t('patient.assistant.aiBadge')}</Badge>
          </span>
        }
        description={t('patient.assistant.subtitle')}
        actions={
          consented && chat.entries.length > 0 ? (
            <Button variant="outline" size="sm" onClick={newChat}>
              <Plus aria-hidden className="h-4 w-4" />
              {t('patient.assistant.newChat')}
            </Button>
          ) : undefined
        }
      />

      <section
        aria-label={t('patient.assistant.title')}
        className="flex h-[calc(100dvh-14rem)] min-h-135 flex-col overflow-hidden rounded-3xl border border-line bg-linear-to-b from-white via-white to-surface-soft shadow-card"
      >
        <AssistantConversation />
      </section>
    </>
  )
}
