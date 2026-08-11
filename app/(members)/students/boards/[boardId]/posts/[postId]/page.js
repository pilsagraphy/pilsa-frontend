import BoardDetailView from '@/components/shared/board/boardDetail/BoardDetailView';
import AuthGuard from '@/components/common/AuthGuard';

export default async function BoardPostPage({ params, searchParams }) {
  const { boardId, postId } = await params;
  const { sort = 'created' } = await searchParams;

  return (
    <AuthGuard>
      <BoardDetailView boardId={boardId} postId={postId} sort={sort} />
    </AuthGuard>
  );
}
