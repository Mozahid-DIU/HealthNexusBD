import { useState } from 'react'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router-dom'
import { CheckCheck, Inbox } from 'lucide-react'
import { PageHeader } from '@/components/layout/dashboard/PageHeader'
import { Card } from '@/components/ui/Card'
import { EmptyState, ErrorState, LoadingBlock } from '@/components/ui/Feedback'
import { ConfirmDialog } from '@/components/ui/Modal'
import { Pagination } from '@/components/ui/Pagination'
import { Segmented } from '@/components/ui/Segmented'
import { Tabs } from '@/components/ui/Tabs'
import { translateApiError } from '@/lib/errors'
import { useClampPage, usePageParam } from '@/lib/usePageParam'
import { toast } from '@/stores/toast'
import { adminApi, adminKeys } from './api'
import type { AccountStatus, DoctorApplication, LabApplication } from './types'
import { ApplicationCard, type Application } from './verifications/ApplicationCard'
import { RejectDialog } from './verifications/RejectDialog'

type Kind = 'doctor' | 'lab'
const STATUSES: AccountStatus[] = ['pending', 'active', 'suspended']

function useApplications(kind: Kind, status: AccountStatus, page: number) {
  const { t } = useTranslation()
  const doctors = useQuery({
    queryKey: adminKeys.doctors(status, page),
    queryFn: () => adminApi.doctors(status, page),
    enabled: kind === 'doctor',
    placeholderData: keepPreviousData,
  })
  const labs = useQuery({
    queryKey: adminKeys.labs(status, page),
    queryFn: () => adminApi.labs(status, page),
    enabled: kind === 'lab',
    placeholderData: keepPreviousData,
  })
  const fromDoctor = (d: DoctorApplication): Application => ({
    id: d.id,
    kind: 'doctor',
    name: d.fullName,
    idLabel: t('admin.verify.bmdc'),
    idValue: d.bmdcNumber,
    detailLabel: t('admin.verify.specialization'),
    detail: d.specialization,
    account: d.account,
    registryLabel: t('admin.verify.bmdcRegistry'),
    registry: d.registry && { name: d.registry.fullName, detail: d.registry.specialization },
  })
  const fromLab = (l: LabApplication): Application => ({
    id: l.id,
    kind: 'lab',
    name: l.centerName,
    idLabel: t('admin.verify.license'),
    idValue: l.licenseNumber,
    detailLabel: t('admin.verify.address'),
    detail: l.address,
    account: l.account,
    registryLabel: t('admin.verify.dghsRegistry'),
    registry: l.registry && { name: l.registry.centerName, detail: l.registry.address },
  })
  const query = kind === 'doctor' ? doctors : labs
  const items = kind === 'doctor' ? (doctors.data?.data ?? []).map(fromDoctor) : (labs.data?.data ?? []).map(fromLab)
  return { query, items, meta: query.data?.meta }
}

/**
 * Doctors and labs waiting for approval, each shown beside the official registry's
 * record. Approving unlocks the account at once; rejecting needs a reason and signs
 * the account out.
 */
export function VerificationsPage() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [params, setParams] = useSearchParams()
  const [page, setPage] = usePageParam()
  const kind: Kind = params.get('type') === 'lab' ? 'lab' : 'doctor'
  const status: AccountStatus = STATUSES.includes(params.get('status') as AccountStatus) ? (params.get('status') as AccountStatus) : 'pending'
  const [approving, setApproving] = useState<Application | null>(null)
  const [rejecting, setRejecting] = useState<Application | null>(null)

  const dashboard = useQuery({ queryKey: adminKeys.dashboard(), queryFn: () => adminApi.dashboard() })
  const { query, items, meta } = useApplications(kind, status, page)
  useClampPage(page, meta, setPage)

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: adminKeys.applications() })
    void queryClient.invalidateQueries({ queryKey: adminKeys.dashboard() })
    void queryClient.invalidateQueries({ queryKey: adminKeys.users() })
    void queryClient.invalidateQueries({ queryKey: adminKeys.audit() })
  }

  const approve = useMutation({
    mutationFn: (app: Application) => (app.kind === 'doctor' ? adminApi.approveDoctor(app.id) : adminApi.approveLab(app.id)),
    onSuccess: (_res, app) => {
      toast.success(t('admin.verify.approvedToast', { name: app.name }))
      setApproving(null)
      refresh()
    },
    onError: (error) => toast.error(translateApiError(error, t)),
  })
  const reject = useMutation({
    mutationFn: ({ app, reason }: { app: Application; reason: string }) =>
      app.kind === 'doctor' ? adminApi.rejectDoctor(app.id, reason) : adminApi.rejectLab(app.id, reason),
    onSuccess: (_res, { app }) => {
      toast.success(t('admin.verify.rejectedToast', { name: app.name }))
      setRejecting(null)
      refresh()
    },
  })

  const setFilter = (next: { type?: Kind; status?: AccountStatus }) => {
    const type = next.type ?? kind
    const nextStatus = next.status ?? status
    setParams({ ...(type === 'lab' ? { type } : {}), ...(nextStatus !== 'pending' ? { status: nextStatus } : {}) }, { replace: true })
  }

  const pending = dashboard.data?.data.pending

  return (
    <>
      <PageHeader title={t('admin.verify.title')} description={t('admin.verify.subtitle')} />
      <Tabs
        label={t('admin.verify.title')}
        value={kind}
        onChange={(type) => setFilter({ type, status: 'pending' })}
        tabs={[
          { id: 'doctor', label: t('admin.verify.doctors'), count: pending?.doctors },
          { id: 'lab', label: t('admin.verify.labs'), count: pending?.labs },
        ]}
      >
        <div className="mb-4">
          <Segmented
            label={t('admin.verify.show')}
            value={status}
            onChange={(next) => setFilter({ status: next })}
            options={[
              { value: 'pending', label: t('admin.verify.pending') },
              { value: 'active', label: t('admin.verify.approved') },
              { value: 'suspended', label: t('admin.verify.rejected') },
            ]}
          />
        </div>

        {query.isPending ? (
          <Card>
            <LoadingBlock lines={5} />
          </Card>
        ) : query.isError ? (
          <Card>
            <ErrorState error={query.error} onRetry={() => void query.refetch()} />
          </Card>
        ) : items.length === 0 ? (
          <Card>
            <EmptyState
              icon={status === 'pending' ? <CheckCheck aria-hidden className="h-6 w-6" /> : <Inbox aria-hidden className="h-6 w-6" />}
              title={status === 'pending' ? t('admin.verify.emptyPending') : t('admin.verify.empty')}
              description={status === 'pending' ? t('admin.verify.emptyPendingBody') : t('admin.verify.emptyBody')}
            />
          </Card>
        ) : (
          <>
            <ul className={`space-y-4 transition-opacity ${query.isPlaceholderData ? 'opacity-60' : ''}`}>
              {items.map((app) => (
                <ApplicationCard key={app.id} app={app} onApprove={() => setApproving(app)} onReject={() => setRejecting(app)} />
              ))}
            </ul>
            {meta && <Pagination meta={meta} onPageChange={setPage} disabled={query.isFetching} />}
          </>
        )}
      </Tabs>

      <ConfirmDialog
        open={approving !== null}
        title={t('admin.verify.approveTitle', { name: approving?.name ?? '' })}
        description={approving?.kind === 'lab' ? t('admin.verify.approveLab') : t('admin.verify.approveDoctor')}
        confirmLabel={t('admin.verify.approve')}
        busy={approve.isPending}
        onConfirm={() => approving && approve.mutate(approving)}
        onCancel={() => setApproving(null)}
      />
      <RejectDialog
        key={rejecting?.id ?? 'closed'}
        name={rejecting?.name ?? null}
        busy={reject.isPending}
        error={reject.error}
        onConfirm={(reason) => rejecting && reject.mutate({ app: rejecting, reason })}
        onCancel={() => {
          setRejecting(null)
          reject.reset()
        }}
      />
    </>
  )
}
