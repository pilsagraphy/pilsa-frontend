import AuthGuard from '@/components/common/AuthGuard';
import CommentListSection from '@/components/service/adminComments/CommentListSection';

export default function AdminCommentsPage() {
  return (
    <AuthGuard>
      <CommentListSection title="댓글 관리" />
    </AuthGuard>
  );
}
