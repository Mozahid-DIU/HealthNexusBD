import { useCallback, useState } from 'react'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router-dom'
import { UserRoundSearch } from 'lucide-react'
import { PageHeader } from '@/components/layout/dashboard/PageHeader'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState, ErrorState, LoadingBlock } from '@/components/ui/Feedback'
import { ConfirmDialog } from '@/components/ui/Modal'
import { Pagination } from '@/components/ui/Pagination'
import { useLanguage } from '@/i18n/useLanguage'
import { translateApiError } from '@/lib/errors'
import { formatNumber } from '@/lib/format'
import { useClampPage, usePageParam } from '@/lib/usePageParam'
import { toast } from '@/stores/toast'
import type { Role } from '@/types/api'
import { adminApi, adminKeys, type UserFilters } from './api'
import { FilterSelect, SearchField } from './filters'
import type { AccountStatus, AdminUser } from './types'
import { identity, UserList } from './users/UserList'

const ROLES: Role[] = ['patient', 'doctor', 'lab', 'admin']
const STATUSES: AccountStatus[] = ['active', 'pending', 'suspended']

/** Everyone with an account: find them, see their state, suspend or reactivate. */
export function UsersPage() {
  const { t } = useTranslation()
  const lang = useLanguage()
  const queryClient = useQueryClient()
  const [params, setParams] = useSearchParams()
  const [page, setPage] = usePageParam()
  const q = params.get('q') ?? ''
  const role = ROLES.includes(params.get('role') as Role) ? (params.get('role') as Role) : undefined
  const status = STATUSES.includes(params.get('status') as AccountStatus) ? (params.get('status') as AccountStatus) : undefined
  const filters: UserFilters = { q: q || undefined, role, status, page }
  const [target, setTarget] = useState<AdminUser | null>(null)

  const users = useQuery({
    queryKey: adminKeys.users(filters),
    queryFn: () => adminApi.users(filters),
    placeholderData: keepPreviousData,
  })
  useClampPage(page, users.data?.meta, setPage)

  // Changing a filter starts again from page 1 (the page param is dropped).
  const setFilter = useCallback(
    (key: 'q' | 'role' | 'status', value: string) =>
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          next.delete('page')
          if (value) next.set(key, value)
          else next.delete(key)
          return next
        },
        { replace: true },
      ),
    [setParams],
  )
  const onSearch = useCallback((value: string) => setFilter('q', value), [setFilter])

  const toggle = useMutation({
    mutationFn: (user: AdminUser) => adminApi.setSuspended(user.id, user.status !== 'suspended'),
    onSuccess: (res, user) => {
      const name = identity(user).name
      toast.success(res.data.status === 'suspended' ? t('admin.users.suspendedToast', { name }) : t('admin.users.reactivatedToast', { name }))
      setTarget(null)
      void queryClient.invalidateQueries({ queryKey: adminKeys.users() })
      void queryClient.invalidateQueries({ queryKey: adminKeys.dashboard() })
      void queryClient.invalidateQueries({ queryKey: adminKeys.applications() })
      void queryClient.invalidateQueries({ queryKey: adminKeys.audit() })
    },
    onError: (error) => toast.error(translateApiError(error, t)),
  })

  const filtered = Boolean(q || role || status)
  const targetName = target ? identity(target).name : ''
  const suspending = target?.status !== 'suspended'

  return (
    <>
      <PageHeader title={t('admin.users.title')} description={t('admin.users.subtitle')} />

      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center">
        <SearchField
          label={t('admin.users.search')}
          placeholder={t('admin.users.searchPlaceholder')}
          value={q}
          onChange={onSearch}
          clearLabel={t('admin.users.clearSearch')}
        />
        <div className="grid grid-cols-2 gap-2 sm:flex">
          <FilterSelect
            label={t('admin.users.role')}
            value={role ?? ''}
            onChange={(v) => setFilter('role', v)}
            options={[{ value: '', label: t('admin.users.allRoles') }, ...ROLES.map((r) => ({ value: r, label: t(`roles.${r}`) }))]}
          />
          <FilterSelect
            label={t('admin.users.status')}
            value={status ?? ''}
            onChange={(v) => setFilter('status', v)}
            options={[{ value: '', label: t('admin.users.anyStatus') }, ...STATUSES.map((s) => ({ value: s, label: t(`status.${s}`) }))]}
          />
        </div>
      </div>

      <Card>
        {users.isPending ? (
          <LoadingBlock lines={6} />
        ) : users.isError ? (
          <ErrorState error={users.error} onRetry={() => void users.refetch()} />
        ) : users.data.data.length === 0 ? (
          <EmptyState
            icon={<UserRoundSearch aria-hidden className="h-6 w-6" />}
            title={t('admin.users.empty')}
            description={t('admin.users.emptyBody')}
            action={
              filtered && (
                <Button variant="outline" size="sm" onClick={() => setParams({}, { replace: true })}>
                  {t('admin.users.clear')}
                </Button>
              )
            }
          />
        ) : (
          <>
            <p className="mb-3 text-xs font-semibold text-slate" role="status">
              {t('admin.users.results', { count: formatNumber(users.data.meta?.total ?? users.data.data.length, lang) })}
            </p>
            <div className={`transition-opacity ${users.isPlaceholderData ? 'opacity-60' : ''}`}>
              <UserList users={users.data.data} onToggle={setTarget} />
            </div>
          </>
        )}
      </Card>
      {users.data?.meta && users.data.data.length > 0 && (
        <Pagination meta={users.data.meta} onPageChange={setPage} disabled={users.isFetching} />
      )}

      <ConfirmDialog
        open={target !== null}
        tone={suspending ? 'danger' : 'primary'}
        title={suspending ? t('admin.users.suspendTitle', { name: targetName }) : t('admin.users.reactivateTitle', { name: targetName })}
        description={suspending ? t('admin.users.suspendBody') : t('admin.users.reactivateBody')}
        confirmLabel={suspending ? t('admin.users.suspend') : t('admin.users.reactivate')}
        busy={toggle.isPending}
        onConfirm={() => target && toggle.mutate(target)}
        onCancel={() => setTarget(null)}
      />
    </>
  )
}
