import NoticeWrite from '@/components/service/noticeWrite/NoticeWrite';
import AuthGuard from '@/components/common/AuthGuard';
export default function NoticeWritePage() {
  return (
    <AuthGuard>
      <NoticeWrite />
    </AuthGuard>
  );
}
