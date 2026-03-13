import BoardSection from '@/components/shared/board/BoardSection';
import AuthGuard from '@/components/common/AuthGuard';
import { DUMMY_POSTS_NOTICES } from '@/mocks/postsData';
export default function NoticePage() {
  return (
    <AuthGuard>
      <BoardSection title="공지사항" boardType="notices" postsData={DUMMY_POSTS_NOTICES} />
    </AuthGuard>
  );
}
