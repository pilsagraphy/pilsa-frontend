import AuthGuard from '@/components/common/AuthGuard';
import PostListSection from '@/components/service/adminPosts/PostListSection';

export default function AdminPostsPage() {
  return (
    <AuthGuard>
      <PostListSection title="게시글 관리" />
    </AuthGuard>
  );
}
