import NoticeWrite from '@/components/service/noticewrite/NoticeWrite';
import AuthGuard from '@/components/common/AuthGuard';
export default function NoticeWritePage() {
  return (
    <AuthGuard>
      <NoticeWrite />
    </AuthGuard>
  );
}
