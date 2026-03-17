import BoardSection from '@/components/shared/board/BoardSection';
import AuthGuard from '@/components/common/AuthGuard';

export default function FreePage() {
  return (
    <AuthGuard>
      <BoardSection title="자유게시판" boardType="free" />
    </AuthGuard>
  );
}


