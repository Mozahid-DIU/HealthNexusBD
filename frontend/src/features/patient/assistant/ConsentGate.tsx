import { useId, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Bot, LockKeyhole, Phone, ShieldCheck, Trash2, type LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import type { TranslationKey } from '@/i18n'

const POINTS: Array<{ icon: LucideIcon; key: TranslationKey; tone: string }> = [
  { icon: Bot, key: 'patient.assistant.point1', tone: 'bg-brand/[0.08] text-brand' },
  { icon: Phone, key: 'patient.assistant.point2', tone: 'bg-red-50 text-red-600' },
  { icon: LockKeyhole, key: 'patient.assistant.point3', tone: 'bg-teal/10 text-teal' },
  { icon: Trash2, key: 'patient.assistant.point4', tone: 'bg-slate-100 text-slate' },
]

/** What the assistant is (and is not), agreed to once before the first question. */
export function ConsentGate({ onAccept }: { onAccept: () => void }) {
  const { t } = useTranslation()
  const [checked, setChecked] = useState(false)
  const checkId = useId()

  return (
    <div className="mx-auto flex max-w-xl flex-col px-5 py-8 sm:py-10">
      <span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand to-teal text-white shadow-brand">
        <ShieldCheck aria-hidden className="h-6 w-6" />
      </span>
      <h2 className="text-center text-lg font-black tracking-tight text-ink">{t('patient.assistant.consentTitle')}</h2>
      <ul className="mt-6 space-y-3">
        {POINTS.map(({ icon: Icon, key, tone }) => (
          <li key={key} className="flex gap-3 rounded-xl border border-line bg-white p-3.5 text-sm leading-relaxed text-body">
            <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${tone}`}>
              <Icon aria-hidden className="h-4 w-4" />
            </span>
            {t(key)}
          </li>
        ))}
      </ul>
      <label htmlFor={checkId} className="mt-6 flex cursor-pointer items-start gap-3 text-sm font-semibold text-ink">
        <input
          id={checkId}
          type="checkbox"
          checked={checked}
          onChange={(e) => setChecked(e.target.checked)}
          className="mt-0.5 h-4 w-4 shrink-0 accent-brand"
        />
        {t('patient.assistant.consentCheck')}
      </label>
      <Button className="mt-5 w-full sm:w-auto sm:self-center" size="lg" disabled={!checked} onClick={onAccept}>
        {t('patient.assistant.start')}
      </Button>
    </div>
  )
}
