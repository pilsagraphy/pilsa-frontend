import AuthGuard from '@/components/common/AuthGuard';
import BoardListSection from '@/components/service/adminBoards/BoardListSection';

export default function AdminBoardsPage() {
  return (
    <AuthGuard>
      <BoardListSection title="게시판 관리" />
    </AuthGuard>
  );
}
