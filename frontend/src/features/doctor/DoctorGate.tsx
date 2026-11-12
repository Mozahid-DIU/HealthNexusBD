import { useTranslation } from 'react-i18next'
import { ApprovalGate } from '@/features/account/ApprovalGate'
import { useAuthStore } from '@/stores/auth'

/** Every doctor page sits behind this until an admin verifies the BMDC registration. */
export function DoctorGate() {
  const { t } = useTranslation()
  const bmdc = useAuthStore((s) => s.user?.doctor?.bmdcNumber)
  return (
    <ApprovalGate
      copy={{
        body: t('doctor.pending.body'),
        idLabel: t('doctor.pending.bmdc'),
        idValue: bmdc,
        firstStep: t('doctor.pending.step1'),
      }}
    />
  )
}
