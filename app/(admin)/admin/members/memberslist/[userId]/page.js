import AuthGuard from '@/components/common/AuthGuard';
import MemberDetailSection from '@/components/service/adminMembers/MemberDetailSection';

// 회원 상세 — 회원 목록에서 아이디를 눌러 들어온다 (PM 2026-10-10)
export default async function AdminMemberDetailPage({ params }) {
  const { userId } = await params;
  return (
    <AuthGuard>
      <MemberDetailSection userId={userId} />
    </AuthGuard>
  );
}
