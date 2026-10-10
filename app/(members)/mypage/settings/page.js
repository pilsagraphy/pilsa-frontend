import MyPageSettingsSection from '@/components/service/myPage/MyPageSettingsSection';
import AuthGuard from '@/components/common/AuthGuard';

// 설정 페이지 — 폰에서는 모달 대신 여기로 (PM 2026-10-10)
export default function MyPageSettingsPage() {
  return (
    <AuthGuard>
      <MyPageSettingsSection />
    </AuthGuard>
  );
}
