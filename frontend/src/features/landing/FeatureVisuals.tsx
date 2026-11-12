import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { CalendarClock, Eye, FileLock2, FileText, MessageSquareText, Sparkles, TriangleAlert, Upload, XCircle } from 'lucide-react'
import { prefersReducedMotion, useVisible } from './motion'

/** Small, illustrative product moments shown inside the feature cards (decorative). */

export function TimelineVisual() {
  const { t } = useTranslation()
  const events = [
    { kind: t('landing.features.idKind1'), text: t('landing.features.idEvent1'), dot: 'bg-brand' },
    { kind: t('landing.features.idKind2'), text: t('landing.features.idEvent2'), dot: 'bg-teal' },
    { kind: t('landing.features.idKind3'), text: t('landing.features.idEvent3'), dot: 'bg-[#eb6834]' },
  ]
  return (
    <ol aria-hidden className="relative mt-6 space-y-3 before:absolute before:bottom-3 before:left-[46px] before:top-3 before:w-px before:bg-line">
      {events.map((e) => (
        <li key={e.text} className="relative flex items-center gap-3">
          <span className="w-9 shrink-0 text-right text-xs font-bold text-slate">{e.kind}</span>
          <span className={`relative z-10 h-3 w-3 shrink-0 rounded-full ring-4 ring-white ${e.dot}`} />
          <span className="flex-1 rounded-xl border border-line bg-white px-3.5 py-2.5 text-sm font-semibold text-ink shadow-card">{e.text}</span>
        </li>
      ))}
    </ol>
  )
}

const CODE = '482913'

/** The six boxes fill digit by digit, then confirm — the consent moment. */
export function OtpVisual() {
  const [ref, visible] = useVisible<HTMLDivElement>()
  const [filled, setFilled] = useState(0)
  useEffect(() => {
    if (!visible) return
    if (prefersReducedMotion()) {
      setFilled(CODE.length)
      return
    }
    const timer = window.setInterval(() => setFilled((n) => (n >= CODE.length + 4 ? 0 : n + 1)), 420)
    return () => window.clearInterval(timer)
  }, [visible])
  const done = filled >= CODE.length
  return (
    <div ref={ref} aria-hidden className="mt-6 flex justify-center gap-1.5 sm:gap-2">
      {CODE.split('').map((digit, i) => (
        <span
          key={i}
          className={`flex h-12 w-9 items-center justify-center rounded-xl border-2 font-mono text-lg font-bold transition-all duration-300 sm:w-10 ${
            done ? 'border-emerald-400 bg-emerald-50 text-emerald-700' : i < filled ? 'border-brand/60 bg-white text-ink' : 'border-line bg-white text-transparent'
          }`}
        >
          {i < filled ? digit : i === filled ? <span className="lp-caret h-5 w-0.5 bg-brand" /> : '·'}
        </span>
      ))}
    </div>
  )
}

export function AiVisual() {
  const { t } = useTranslation()
  return (
    <div aria-hidden className="mt-6 rounded-2xl border border-line bg-white p-4 shadow-card">
      <p className="flex items-center gap-1.5 text-xs font-bold text-[#0b7f86]">
        <Sparkles className="h-3.5 w-3.5" />
        {t('landing.features.aiLabel')}
      </p>
      <div className="mt-2 space-y-1.5">
        <span className="block h-2 w-11/12 rounded-full bg-slate-100" />
        <span className="block h-2 w-3/4 rounded-full bg-slate-100" />
      </div>
      <p className="mt-3 flex gap-2 rounded-xl bg-red-50 px-3 py-2 text-[13px] font-semibold leading-snug text-red-700">
        <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
        {t('landing.features.aiAlert')}
      </p>
    </div>
  )
}

export function LabVisual() {
  const { t } = useTranslation()
  return (
    <div aria-hidden className="mt-6 flex items-center gap-4 rounded-2xl border border-line bg-white p-4 shadow-card">
      <span className="relative flex h-14 w-12 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-600">
        <FileText className="h-6 w-6" />
        <span className="absolute -bottom-1.5 -right-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-navy text-white ring-2 ring-white">
          <FileLock2 className="h-3.5 w-3.5" />
        </span>
      </span>
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-1.5 text-sm font-bold text-ink">
          <Upload className="h-3.5 w-3.5 text-teal" />
          {t('landing.features.labUploading')}
        </p>
        <span className="mt-2 block h-1.5 overflow-hidden rounded-full bg-slate-100">
          <span className="lp-progress block h-full rounded-full bg-gradient-to-r from-brand to-teal" />
        </span>
        <p className="mt-1.5 font-mono text-[11px] text-slate">AES-256-GCM</p>
      </div>
    </div>
  )
}

export function AuditVisual() {
  const { t } = useTranslation()
  const rows = [
    { icon: <Eye className="h-3.5 w-3.5" />, tint: 'bg-brand/10 text-brand', text: t('landing.features.audit1') },
    { icon: <Upload className="h-3.5 w-3.5" />, tint: 'bg-teal/10 text-teal', text: t('landing.features.audit2') },
    { icon: <XCircle className="h-3.5 w-3.5" />, tint: 'bg-amber-50 text-amber-700', text: t('landing.features.audit3') },
  ]
  return (
    <ul aria-hidden className="mt-6 space-y-2">
      {rows.map((r) => (
        <li key={r.text} className="flex items-center gap-2.5 rounded-xl border border-line bg-white px-3 py-2 text-[13px] font-medium text-body shadow-card">
          <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg ${r.tint}`}>{r.icon}</span>
          <span className="truncate">{r.text}</span>
        </li>
      ))}
    </ul>
  )
}

/** One message in each language: samples of the languages themselves, so not translated. */
const SAMPLE = { en: 'Your report is ready', bn: 'আপনার রিপোর্ট প্রস্তুত' } as const

/** The same message flipping between English and Bangla. */
export function LanguageVisual() {
  const [ref, visible] = useVisible<HTMLDivElement>()
  const [bangla, setBangla] = useState(false)
  useEffect(() => {
    if (!visible || prefersReducedMotion()) return
    const timer = window.setInterval(() => setBangla((b) => !b), 2200)
    return () => window.clearInterval(timer)
  }, [visible])
  return (
    <div ref={ref} aria-hidden className="mt-6 flex flex-wrap items-center gap-3">
      <span className="inline-flex rounded-xl bg-white p-1 text-xs font-bold shadow-card ring-1 ring-line">
        <span className={`rounded-lg px-2.5 py-1 transition ${bangla ? 'text-slate' : 'bg-navy text-white'}`}>EN</span>
        <span className={`rounded-lg px-2.5 py-1 transition ${bangla ? 'bg-navy text-white' : 'text-slate'}`}>বাং</span>
      </span>
      <span
        key={String(bangla)}
        lang={bangla ? 'bn' : 'en'}
        className="lp-rise rounded-xl border border-line bg-white px-3.5 py-2 text-sm font-semibold text-ink shadow-card"
      >
        {bangla ? SAMPLE.bn : SAMPLE.en}
      </span>
    </div>
  )
}

export function ReminderVisual() {
  const { t } = useTranslation()
  return (
    <div aria-hidden className="mt-6 space-y-2.5">
      <p className="flex max-w-[22rem] gap-2.5 rounded-2xl rounded-tl-md bg-white px-3.5 py-2.5 text-[13px] leading-snug text-body shadow-card ring-1 ring-line">
        <MessageSquareText className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
        {t('landing.features.remindSms')}
      </p>
      <p className="ml-6 flex w-fit items-center gap-2 rounded-2xl bg-amber-50 px-3.5 py-2 text-[13px] font-semibold text-amber-800 ring-1 ring-amber-200">
        <CalendarClock className="h-4 w-4 shrink-0" />
        {t('landing.features.remindVisit')}
      </p>
    </div>
  )
}
