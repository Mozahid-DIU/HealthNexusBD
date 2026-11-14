import type { TFunction } from 'i18next'
import type { Language, TranslationKey } from '@/i18n'
import { formatDate } from '@/lib/format'
import type { AuditEntry, PatientNotification } from './types'

/**
 * A notification's title and body in the active language, built from its structured
 * `params`. Older notifications (stored before params existed) show their saved text.
 */
export function notificationText(
  n: PatientNotification,
  t: TFunction,
  lang: Language,
): { title: string; body: string } {
  const p = n.params ?? {}
  if (n.type === 'lab_report' && p.testName && p.labName) {
    return {
      title: t('patient.notifications.labReportTitle'),
      body: t('patient.notifications.labReportBody', { testName: p.testName, labName: p.labName }),
    }
  }
  if (n.type === 'follow_up' && p.date) {
    // A calendar day ("2026-03-11"), not an instant: format it without a time-zone shift.
    const date = formatDate(`${p.date}T00:00:00Z`, lang, { dateOnly: true })
    return {
      title: t('patient.notifications.followUpTitle'),
      body: p.diagnosis
        ? t('patient.notifications.followUpBodyDx', { diagnosis: p.diagnosis, date })
        : t('patient.notifications.followUpBody', { date }),
    }
  }
  return { title: n.title, body: n.body }
}

/** Specific (action, resource-prefix) pairs written by the backend's audit log. */
const AUDIT_TEXT: Record<string, TranslationKey> = {
  'view:patient_records': 'patient.audit.viewedRecords',
  'view:patient_profile': 'patient.audit.viewedProfile',
  'view:lab_reports': 'patient.audit.viewedLabList',
  'view:lab_report_file': 'patient.audit.openedReport',
  'view:patient_search': 'patient.audit.searchedYou',
  'create:medical_record': 'patient.audit.addedRecord',
  'create:prescription': 'patient.audit.addedPrescription',
  'create:ai_summary': 'patient.audit.generatedSummary',
  'view:ai_overview': 'patient.audit.viewedAiOverview',
  'view:ai_assistant': 'patient.audit.sharedWithAssistant',
  'create:lab_report': 'patient.audit.uploadedReport',
  'create:consent_request': 'patient.audit.requestedAccess',
  'grant:session': 'patient.audit.accessGranted',
  'revoke:session': 'patient.audit.accessRevoked',
  'revoke:consent_request': 'patient.audit.requestDenied',
}

const AUDIT_FALLBACK: Record<AuditEntry['action'], TranslationKey> = {
  view: 'patient.audit.otherView',
  create: 'patient.audit.otherCreate',
  update: 'patient.audit.otherUpdate',
  grant: 'patient.audit.otherGrant',
  revoke: 'patient.audit.otherRevoke',
  login: 'patient.audit.otherLogin',
}

/** A readable sentence for an audit entry ("Viewed your medical records"). */
export function auditDescription(entry: AuditEntry, t: TFunction): string {
  const prefix = entry.resource?.split(':')[0] ?? ''
  const key = AUDIT_TEXT[`${entry.action}:${prefix}`] ?? AUDIT_FALLBACK[entry.action]
  return t(key ?? 'patient.audit.otherView')
}

/** Whole minutes until `expiresAt`, rounded up; 0 once it has passed or if invalid. */
export function minutesLeft(expiresAt: string, now: number = Date.now()): number {
  const end = new Date(expiresAt).getTime()
  if (Number.isNaN(end)) return 0
  return Math.max(0, Math.ceil((end - now) / 60_000))
}

/** Defensive: JSON columns from the API are arrays in practice, but never trust shape. */
export function asList(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string') : []
}
