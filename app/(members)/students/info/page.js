import BoardSection from '@/components/shared/board/BoardSection';
import AuthGuard from '@/components/common/AuthGuard';
import { DUMMY_POSTS_INFO } from '@/mocks/postsData';
export default function FreePage() {
  return (
    <AuthGuard>
      <BoardSection title="정보게시판" boardType="info" postsData={DUMMY_POSTS_INFO} />
    </AuthGuard>
  );
}
