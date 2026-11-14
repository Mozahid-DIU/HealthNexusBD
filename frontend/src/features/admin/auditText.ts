import type { TFunction } from 'i18next'
import type { AdminMessages } from '@/i18n/locales/areas/admin'
import type { AuditRow } from './types'

type EventKey = keyof AdminMessages['audit']['events']

/** (action, resource prefix) pairs the backend writes, as readable events. */
const EVENTS: Record<string, EventKey> = {
  'view:patient_records': 'viewedRecords',
  'view:patient_profile': 'viewedProfile',
  'view:lab_reports': 'viewedLabList',
  'view:lab_report_file': 'openedReport',
  'view:patient_search': 'searchedPatient',
  'create:medical_record': 'addedRecord',
  'create:prescription': 'addedPrescription',
  'create:ai_summary': 'generatedSummary',
  'view:ai_overview': 'viewedAiOverview',
  'view:ai_assistant': 'sharedWithAssistant',
  'create:lab_report': 'uploadedReport',
  'create:consent_request': 'requestedAccess',
  'grant:session': 'accessGranted',
  'revoke:session': 'accessRevoked',
  'revoke:consent_request': 'requestDenied',
  'update:doctor_approved': 'doctorApproved',
  'update:doctor_rejected': 'doctorRejected',
  'update:lab_approved': 'labApproved',
  'update:lab_rejected': 'labRejected',
  'update:user_suspended': 'userSuspended',
  'update:user_reactivated': 'userReactivated',
}

/**
 * A readable sentence for an audit entry, plus the admin's reason for a rejection
 * (stored as "…_rejected:<id> (reason)"). Unknown entries say "Other activity" rather
 * than leaking raw resource strings.
 */
export function describeAudit(row: AuditRow, t: TFunction): { text: string; reason: string | null } {
  if (row.action === 'login') return { text: t('admin.audit.events.signedIn'), reason: null }
  const prefix = row.resource?.split(':')[0] ?? ''
  const event = EVENTS[`${row.action}:${prefix}`] ?? 'other'
  const reason = event === 'doctorRejected' || event === 'labRejected' ? (row.resource?.match(/\((.+)\)$/)?.[1] ?? null) : null
  return { text: t(`admin.audit.events.${event}`), reason }
}
