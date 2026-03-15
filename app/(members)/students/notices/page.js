import BoardSection from '@/components/shared/board/BoardSection';
import AuthGuard from '@/components/common/AuthGuard';

export default function NoticePage() {
  return (
    <AuthGuard>
      <BoardSection title="공지사항" boardType="notices" />
    </AuthGuard>
  );
}
