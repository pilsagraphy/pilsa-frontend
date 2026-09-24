import AuthGuard from '@/components/common/AuthGuard';
import PostDetailSection from '@/components/service/adminPosts/PostDetailSection';

// ?from=posts|comments — 어디서 들어왔는지. 상세의 '돌아가기'가 이 값으로 목적지를 정한다.
// 게시글 관리에서 제목을 누르면 posts, 댓글 관리에서 원글을 누르면 comments 다.
export default async function AdminPostDetailPage({ params, searchParams }) {
  const { postId } = await params;
  const { from } = await searchParams;

  return (
    <AuthGuard>
      <PostDetailSection postId={postId} from={from} />
    </AuthGuard>
  );
}
