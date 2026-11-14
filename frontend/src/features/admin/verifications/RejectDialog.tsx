import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/Button'
import { FormError } from '@/components/ui/FormError'
import { Modal } from '@/components/ui/Modal'
import { Textarea } from '@/components/ui/Textarea'

const MIN = 3
const MAX = 200

interface RejectDialogProps {
  name: string | null
  busy: boolean
  error: unknown
  onConfirm: (reason: string) => void
  onCancel: () => void
}

/** A rejection always carries a reason; it goes into the audit log. */
export function RejectDialog({ name, busy, error, onConfirm, onCancel }: RejectDialogProps) {
  const { t } = useTranslation()
  const [reason, setReason] = useState('')
  const [touched, setTouched] = useState(false)
  const tooShort = reason.trim().length < MIN

  const submit = () => {
    setTouched(true)
    if (!tooShort) onConfirm(reason.trim())
  }

  return (
    <Modal
      open={name !== null}
      onClose={onCancel}
      dismissible={!busy}
      title={t('admin.verify.rejectTitle', { name: name ?? '' })}
      description={t('admin.verify.rejectBody')}
      footer={
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="ghost" onClick={onCancel} disabled={busy}>
            {t('admin.verify.cancel')}
          </Button>
          <Button onClick={submit} disabled={busy} className="bg-red-600! shadow-none! hover:bg-red-700!">
            {busy ? t('admin.verify.rejecting') : t('admin.verify.reject')}
          </Button>
        </div>
      }
    >
      <div className="space-y-3">
        {error != null && <FormError error={error} />}
        <Textarea
          id="reject-reason"
          label={t('admin.verify.reason')}
          placeholder={t('admin.verify.reasonPlaceholder')}
          value={reason}
          onChange={(e) => setReason(e.target.value.slice(0, MAX))}
          rows={3}
          error={touched && tooShort ? t('admin.verify.reasonTooShort') : undefined}
          autoFocus
        />
      </div>
    </Modal>
  )
}
