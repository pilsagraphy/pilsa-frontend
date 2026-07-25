import NoticeDetailView from '@/components/service/noticeDetail/NoticeDetailView';
import AuthGuard from '@/components/common/AuthGuard';

export default async function NoticeDetailPage({ params, searchParams }) {
  const { id } = await params;
  const { sort = 'latest' } = await searchParams;

  return (
    <AuthGuard>
      <NoticeDetailView noticeId={id} sort={sort} />
    </AuthGuard>
  );
}
