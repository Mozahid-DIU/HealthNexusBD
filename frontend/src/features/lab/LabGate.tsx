import { useTranslation } from 'react-i18next'
import { ApprovalGate } from '@/features/account/ApprovalGate'
import { useAuthStore } from '@/stores/auth'

/** Every lab page sits behind this until an admin verifies the DGHS licence. */
export function LabGate() {
  const { t } = useTranslation()
  const license = useAuthStore((s) => s.user?.lab?.licenseNumber)
  return (
    <ApprovalGate
      copy={{
        body: t('lab.pending.body'),
        idLabel: t('lab.pending.license'),
        idValue: license,
        firstStep: t('lab.pending.step1'),
      }}
    />
  )
}
