import InfoDetailView from '@/components/service/infoDetail/InfoDetailView';
import AuthGuard from '@/components/common/AuthGuard';

export default async function InfoDetailPage({ params }) {
  const { id } = await params;
  return (
    <AuthGuard>
      <InfoDetailView postId={id} />
    </AuthGuard>
  );
}
