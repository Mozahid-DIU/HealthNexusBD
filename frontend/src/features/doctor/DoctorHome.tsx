import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'
import { ChevronRight, UsersRound } from 'lucide-react'
import { PageHeader } from '@/components/layout/dashboard/PageHeader'
import { Card, CardHeader } from '@/components/ui/Card'
import { EmptyState, ErrorState, LoadingBlock } from '@/components/ui/Feedback'
import { displayName } from '@/features/account/displayName'
import { useAuthStore } from '@/stores/auth'
import { doctorApi, doctorKeys } from './api'
import { ConsentedPatientList } from './ConsentedPatientList'
import { PatientSearchForm } from '@/features/clinical/PatientSearchForm'

const HOME_LIMIT = 4

export function DoctorHome() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const patients = useQuery({ queryKey: doctorKeys.patients(), queryFn: () => doctorApi.patients(), refetchInterval: 30_000 })
  const list = patients.data?.data ?? []

  return (
    <>
      <PageHeader title={t('doctor.home.title', { name: user ? displayName(user) : '' })} description={t('doctor.home.subtitle')} />

      <Card padding="lg" className="mb-6 bg-linear-to-br from-white to-brand/4">
        <PatientSearchForm autoFocus onSearch={(q) => navigate(`/doctor/find?q=${encodeURIComponent(q)}`)} />
      </Card>

      <Card as="section" aria-labelledby="active-patients">
        <CardHeader
          id="active-patients"
          title={t('doctor.home.activeTitle')}
          action={
            list.length > HOME_LIMIT && (
              <Link to="/doctor/patients" className="inline-flex items-center gap-1 text-sm font-semibold text-brand hover:underline">
                {t('doctor.home.viewAll')}
                <ChevronRight aria-hidden className="h-4 w-4" />
              </Link>
            )
          }
        />
        {patients.isPending ? (
          <LoadingBlock />
        ) : patients.isError ? (
          <ErrorState error={patients.error} onRetry={() => void patients.refetch()} />
        ) : list.length === 0 ? (
          <EmptyState
            icon={<UsersRound aria-hidden className="h-6 w-6" />}
            title={t('doctor.home.activeEmpty')}
            description={t('doctor.home.activeEmptyBody')}
          />
        ) : (
          <ConsentedPatientList patients={list.slice(0, HOME_LIMIT)} />
        )}
      </Card>
    </>
  )
}
