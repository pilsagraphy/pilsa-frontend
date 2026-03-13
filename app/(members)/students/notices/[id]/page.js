import NoticeDetailView from '@/components/service/notices/detail/NoticeDetailView';
import AuthGuard from '@/components/common/AuthGuard';

export default function Page({ params }) {
  const { id } = params;
  return (
    <AuthGuard>
      <NoticeDetailView noticeId={id} />
    </AuthGuard>
  );
}
