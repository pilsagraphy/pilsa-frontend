import FreeDetailView from '@/components/service/freeDetail/FreeDetailView';
import AuthGuard from '@/components/common/AuthGuard';

export default async function FreeDetailPage({ params }) {
  const { id } = await params;

  return (
    <AuthGuard>
      <FreeDetailView postId={id} />
    </AuthGuard>
  );
}
