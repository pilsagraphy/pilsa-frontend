import BoardDetailView from '@/components/shared/board/boardDetail/BoardDetailView';
import AuthGuard from '@/components/common/AuthGuard';
import { buildBoardListQuery } from '@/lib/boardDetail';

export default async function BoardPostPage({ params, searchParams }) {
  const { boardId, postId } = await params;
  const query = await searchParams;

  const { sort = 'created' } = query;
  // 목록에서 넘어올 때 실어 보낸 상태(페이지·검색어 등) — 목록으로 되돌아갈 때 그대로 쓴다
  const listQuery = buildBoardListQuery(query);

  return (
    <AuthGuard>
      <BoardDetailView boardId={boardId} postId={postId} sort={sort} listQuery={listQuery} />
    </AuthGuard>
  );
}
