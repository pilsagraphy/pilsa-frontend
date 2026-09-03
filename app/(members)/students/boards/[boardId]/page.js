import BoardSection from '@/components/shared/board/boardList/BoardSection';
import AuthGuard from '@/components/common/AuthGuard';

export default async function BoardListPage({ params }) {
  const { boardId } = await params;

  return (
    <AuthGuard>
      <BoardSection boardId={boardId} />
    </AuthGuard>
  );
}
