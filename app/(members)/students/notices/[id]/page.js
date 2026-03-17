import NoticeDetailView from '@/components/service/noticeDetail/NoticeDetailView';
import AuthGuard from '@/components/common/AuthGuard';

export default function NoticeDetailPage({ params, searchParams }) {
  const { id } = params;
  const sort = searchParams?.sort ?? 'latest';

  return (
    <AuthGuard>
      <NoticeDetailView noticeId={id} sort={sort} />
    </AuthGuard>
  );
}
