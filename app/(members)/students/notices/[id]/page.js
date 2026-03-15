import NoticeDetailView from '@/components/service/notices/detail/NoticeDetailView';
import AuthGuard from '@/components/common/AuthGuard';

export default function Page({ params, searchParams }) {
  const { id } = params;
  const sort = searchParams?.sort ?? 'latest';

  return (
    <AuthGuard>
      <NoticeDetailView noticeId={id} sort={sort} />
    </AuthGuard>
  );
}
