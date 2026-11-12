import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Lock } from 'lucide-react'
import { PdfDropzone } from '@/components/files/PdfDropzone'
import { Button } from '@/components/ui/Button'
import { FormError } from '@/components/ui/FormError'
import { Modal } from '@/components/ui/Modal'
import { ApiError } from '@/lib/api'
import { labApi, labKeys } from './api'
import type { LabSearchResult } from './types'

interface UploadDialogProps {
  patient: LabSearchResult
  /** The test being reported; null keeps the dialog closed. */
  testName: string | null
  onClose: () => void
  onUploaded: (testName: string) => void
}

/** Attach one PDF to one ordered test. Can't be dismissed mid-upload. */
export function UploadDialog({ patient, testName, onClose, onUploaded }: UploadDialogProps) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [file, setFile] = useState<File | null>(null)

  const upload = useMutation({
    mutationFn: (input: { testName: string; file: File }) => labApi.upload({ uhid: patient.uhid, ...input }),
    onSuccess: (_res, input) => {
      setFile(null)
      onUploaded(input.testName)
    },
    // The ordered tests changed under us (e.g. the prescription was edited): refresh them.
    onError: (error) => {
      if (error instanceof ApiError && error.code === 'TEST_NOT_PRESCRIBED') {
        void queryClient.invalidateQueries({ queryKey: labKeys.search() })
      }
    },
  })

  const close = () => {
    if (upload.isPending) return
    setFile(null)
    upload.reset()
    onClose()
  }

  return (
    <Modal
      open={testName !== null}
      onClose={close}
      dismissible={!upload.isPending}
      title={t('lab.upload.dialogTitle', { test: testName ?? '' })}
      description={t('lab.upload.dialogFor', { name: patient.fullName, uhid: patient.uhid })}
      footer={
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="ghost" onClick={close} disabled={upload.isPending}>
            {t('lab.upload.cancel')}
          </Button>
          <Button
            onClick={() => file && testName && upload.mutate({ testName, file })}
            disabled={!file || upload.isPending}
          >
            {upload.isPending ? t('lab.upload.uploading') : t('lab.upload.submit')}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        {upload.isError && <FormError error={upload.error} />}
        <PdfDropzone
          file={file}
          onChange={(next) => {
            setFile(next)
            if (upload.isError) upload.reset()
          }}
          disabled={upload.isPending}
        />
        <p className="flex gap-2 rounded-xl bg-teal/[0.06] px-3.5 py-2.5 text-xs leading-relaxed text-body">
          <Lock aria-hidden className="mt-0.5 h-3.5 w-3.5 shrink-0 text-teal" />
          {t('lab.upload.secureNote', { name: patient.fullName })}
        </p>
      </div>
    </Modal>
  )
}
