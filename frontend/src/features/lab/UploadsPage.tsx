import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { History, Upload } from 'lucide-react'
import { PageHeader } from '@/components/layout/dashboard/PageHeader'
import { Card } from '@/components/ui/Card'
import { EmptyState, ErrorState, LoadingBlock } from '@/components/ui/Feedback'
import { Pagination } from '@/components/ui/Pagination'
import { useClampPage, usePageParam } from '@/lib/usePageParam'
import { labApi, labKeys, PAGE_SIZE } from './api'
import { UploadList } from './UploadList'

export function UploadsPage() {
  const { t } = useTranslation()
  const [page, setPage] = usePageParam()
  const uploads = useQuery({
    queryKey: labKeys.uploads(page, PAGE_SIZE),
    queryFn: () => labApi.uploads(page),
    placeholderData: keepPreviousData,
  })
  useClampPage(page, uploads.data?.meta, setPage)

  return (
    <>
      <PageHeader
        title={t('lab.history.title')}
        description={t('lab.history.subtitle')}
        actions={
          <Link
            to="/lab/upload"
            className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white shadow-brand hover:bg-brand-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          >
            <Upload aria-hidden className="h-4 w-4" />
            {t('dashboard.nav.uploadReport')}
          </Link>
        }
      />
      <Card>
        {uploads.isPending ? (
          <LoadingBlock lines={5} />
        ) : uploads.isError ? (
          <ErrorState error={uploads.error} onRetry={() => void uploads.refetch()} />
        ) : uploads.data.data.length === 0 ? (
          <EmptyState
            icon={<History aria-hidden className="h-6 w-6" />}
            title={t('lab.history.empty')}
            description={t('lab.history.emptyBody')}
          />
        ) : (
          <UploadList uploads={uploads.data.data} />
        )}
      </Card>
      {uploads.data?.meta && uploads.data.data.length > 0 && (
        <Pagination meta={uploads.data.meta} onPageChange={setPage} disabled={uploads.isFetching} />
      )}
    </>
  )
}
