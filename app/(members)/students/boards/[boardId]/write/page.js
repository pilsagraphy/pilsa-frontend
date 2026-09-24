import BoardWrite from '@/components/shared/board/boardWrite/BoardWrite';
import AuthGuard from '@/components/common/AuthGuard';

export default async function BoardWritePage({ params }) {
  const { boardId } = await params;

  return (
    <AuthGuard>
      <BoardWrite boardId={boardId} />
    </AuthGuard>
  );
}
