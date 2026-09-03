import Edit from '@/components/shared/Edit';
import AuthGuard from '@/components/common/AuthGuard';

export default async function BoardPostEditPage({ params }) {
  const { boardId, postId } = await params;

  return (
    <AuthGuard>
      <Edit boardId={boardId} postId={postId} />
    </AuthGuard>
  );
}
