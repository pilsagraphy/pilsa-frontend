import FreeDetailView from '@/components/service/freeDetail/FreeDetailView';
import AuthGuard from '@/components/common/AuthGuard';

export default function FreeDetailPage({ params }) {
  const { id } = params;
  return (
    <AuthGuard>
      <FreeDetailView postId={id} />
    </AuthGuard>
  );
}
