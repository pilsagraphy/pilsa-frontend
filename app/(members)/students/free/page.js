import BoardSection from '@/components/shared/board/BoardSection';
import AuthGuard from '@/components/common/AuthGuard';
import { DUMMY_POSTS_FREE } from '@/mocks/postsData';
export default function FreePage() {
  return (
    <AuthGuard>
      <BoardSection title="자유게시판" boardType="free" postsData={DUMMY_POSTS_FREE} />
    </AuthGuard>
  );
}
