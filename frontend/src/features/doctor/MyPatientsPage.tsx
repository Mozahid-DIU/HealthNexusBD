import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { Search, UsersRound } from 'lucide-react'
import { PageHeader } from '@/components/layout/dashboard/PageHeader'
import { Card } from '@/components/ui/Card'
import { EmptyState, ErrorState, LoadingBlock } from '@/components/ui/Feedback'
import { doctorApi, doctorKeys } from './api'
import { ConsentedPatientList } from './ConsentedPatientList'

const findLink =
  'inline-flex items-center gap-2 rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white shadow-brand transition hover:bg-brand-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand'

export function MyPatientsPage() {
  const { t } = useTranslation()
  const patients = useQuery({ queryKey: doctorKeys.patients(), queryFn: () => doctorApi.patients(), refetchInterval: 30_000 })

  return (
    <>
      <PageHeader
        title={t('doctor.patients.title')}
        description={t('doctor.patients.subtitle')}
        actions={
          <Link to="/doctor/find" className={findLink}>
            <Search aria-hidden className="h-4 w-4" />
            {t('doctor.patients.findPatient')}
          </Link>
        }
      />
      {patients.isPending ? (
        <Card>
          <LoadingBlock />
        </Card>
      ) : patients.isError ? (
        <Card>
          <ErrorState error={patients.error} onRetry={() => void patients.refetch()} />
        </Card>
      ) : patients.data.data.length === 0 ? (
        <Card>
          <EmptyState
            icon={<UsersRound aria-hidden className="h-6 w-6" />}
            title={t('doctor.patients.empty')}
            description={t('doctor.patients.emptyBody')}
          />
        </Card>
      ) : (
        <ConsentedPatientList patients={patients.data.data} />
      )}
    </>
  )
}
