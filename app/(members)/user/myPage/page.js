import MyPageSection from '@/components/service/myPage/MyPageSection';
import AuthGuard from '@/components/common/AuthGuard';

export default function MyPage() {
  return (
    <AuthGuard>
      <MyPageSection />
    </AuthGuard>
  );
}
