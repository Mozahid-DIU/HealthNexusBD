import { useTranslation } from 'react-i18next'
import { Lightbulb, Pill, TriangleAlert } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { useLanguage } from '@/i18n/useLanguage'
import { formatDateTime } from '@/lib/format'
import { asList } from '@/features/patient/text'
import type { AiSummary, Medication, Prescription, SideEffect, SideEffectText } from '@/features/patient/types'

/* Read-only clinical views shared by the patient and doctor dashboards (strings: clinical.*). */

function medicationsOf(p: Prescription): Medication[] {
  return Array.isArray(p.medications) ? p.medications.filter((m) => m && typeof m.name === 'string') : []
}

export function PrescriptionCard({ prescription }: { prescription: Prescription }) {
  const { t } = useTranslation()
  const meds = medicationsOf(prescription)
  const tests = asList(prescription.recommendedTests)
  return (
    <div className="space-y-4">
      {meds.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-line">
          <table className="w-full min-w-110 text-left text-sm">
            <thead className="bg-surface-soft text-xs uppercase tracking-wide text-slate">
              <tr>
                <th scope="col" className="px-4 py-2.5 font-semibold">{t('clinical.medicine')}</th>
                <th scope="col" className="px-4 py-2.5 font-semibold">{t('clinical.dose')}</th>
                <th scope="col" className="px-4 py-2.5 font-semibold">{t('clinical.frequency')}</th>
                <th scope="col" className="px-4 py-2.5 font-semibold">{t('clinical.duration')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {meds.map((m, i) => (
                <tr key={`${m.name}-${i}`}>
                  <td className="px-4 py-2.5 font-semibold text-ink">{m.name}</td>
                  <td className="px-4 py-2.5 text-body">{m.dose}</td>
                  <td className="px-4 py-2.5 text-body">{m.frequency}</td>
                  <td className="px-4 py-2.5 text-body">{m.duration ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {tests.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-faint">{t('clinical.tests')}</p>
          <div className="flex flex-wrap gap-2">
            {tests.map((test) => (
              <Badge key={test} tone="brand">{test}</Badge>
            ))}
          </div>
        </div>
      )}
      {prescription.notes && (
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-faint">{t('clinical.notes')}</p>
          <p className="whitespace-pre-line text-sm text-body">{prescription.notes}</p>
        </div>
      )}
    </div>
  )
}

export function AlertList({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) return null
  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
      <p className="mb-2 flex items-center gap-2 text-sm font-bold text-amber-800">
        <TriangleAlert aria-hidden className="h-4 w-4" />
        {title}
      </p>
      <ul className="list-disc space-y-1 pl-5 text-sm text-amber-900">
        {items.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>
    </div>
  )
}

const isTextList = (v: unknown): v is string[] => Array.isArray(v) && v.every((x) => typeof x === 'string')

/** The entry's text in `lang`, or null if the stored JSON isn't the expected shape. */
function sideEffectText(entry: SideEffect, lang: 'en' | 'bn'): SideEffectText | null {
  const text = entry?.[lang]
  return text && isTextList(text.common) && isTextList(text.serious) ? text : null
}

interface Entry {
  drug: string
  ai: boolean
  text: SideEffectText
}

/** The usable entries, in the reader's language (malformed stored JSON is skipped). */
export function sideEffectEntries(items: unknown, lang: 'en' | 'bn'): Entry[] {
  if (!Array.isArray(items)) return []
  return (items as SideEffect[])
    .map((entry) => ({ drug: entry?.drug, ai: entry?.source === 'ai', text: sideEffectText(entry, lang) }))
    .filter((e): e is Entry => typeof e.drug === 'string' && e.text !== null)
}

/**
 * What each prescribed medicine may cause, and which signs need a doctor now.
 * `framed` (default) draws its own box and title; unframed it sits inside a card that has one.
 */
export function SideEffectsList({ items, framed = true }: { items: SideEffect[]; framed?: boolean }) {
  const { t } = useTranslation()
  const lang = useLanguage()
  const entries = sideEffectEntries(items, lang)
  if (entries.length === 0) return null

  const Wrapper = framed ? 'section' : 'div'
  return (
    <Wrapper
      aria-label={framed ? t('clinical.sideEffects.title') : undefined}
      className={framed ? 'rounded-xl border border-line p-4' : undefined}
    >
      {framed && (
        <p className="mb-3 flex items-center gap-2 text-sm font-bold text-ink">
          <Pill aria-hidden className="h-4 w-4 text-brand" />
          {t('clinical.sideEffects.title')}
        </p>
      )}
      <ul className="space-y-3">
        {entries.map(({ drug, ai, text }, i) => (
          <li key={`${drug}-${i}`} className="rounded-xl bg-surface-soft p-3.5">
            <p className="mb-2.5 flex flex-wrap items-center gap-2 font-bold text-ink">
              {drug}
              {ai && <Badge tone="brand">{t('clinical.sideEffects.aiWritten')}</Badge>}
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate [:lang(bn)_&]:normal-case [:lang(bn)_&]:tracking-normal">
                  {t('clinical.sideEffects.common')}
                </p>
                <ul className="list-disc space-y-0.5 pl-4 text-sm text-body">
                  {text.common.map((c) => (
                    <li key={c}>{c}</li>
                  ))}
                </ul>
              </div>
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2">
                <p className="mb-1 flex items-center gap-1.5 text-xs font-bold text-red-700">
                  <TriangleAlert aria-hidden className="h-3.5 w-3.5" />
                  {t('clinical.sideEffects.serious')}
                </p>
                <ul className="list-disc space-y-0.5 pl-4 text-sm text-red-900">
                  {text.serious.map((c) => (
                    <li key={c}>{c}</li>
                  ))}
                </ul>
              </div>
            </div>
            {text.advice && (
              <p className="mt-2.5 flex gap-1.5 text-sm text-body">
                <Lightbulb aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                <span>
                  <span className="sr-only">{t('clinical.sideEffects.tip')}: </span>
                  {text.advice}
                </span>
              </p>
            )}
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs text-slate">{t('clinical.sideEffects.note')}</p>
    </Wrapper>
  )
}

export function AiSummaryCard({ summary }: { summary: AiSummary }) {
  const { t } = useTranslation()
  const lang = useLanguage()
  return (
    <div className="space-y-4">
      <p className="whitespace-pre-line text-sm leading-relaxed text-body">{summary.summary}</p>
      <AlertList title={t('clinical.allergyAlerts')} items={asList(summary.allergyAlerts)} />
      <AlertList title={t('clinical.interactionAlerts')} items={asList(summary.interactionAlerts)} />
      {Array.isArray(summary.sideEffects) && <SideEffectsList items={summary.sideEffects} />}
      <p className="text-xs text-slate">
        {t('clinical.aiDisclaimer')} · {formatDateTime(summary.generatedAt, lang)}
      </p>
    </div>
  )
}
