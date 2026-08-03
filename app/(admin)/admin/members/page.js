import AuthGuard from '@/components/common/AuthGuard';
import MemberListSection from '@/components/service/adminMembers/MemberListSection';

export default function AdminMembersPage() {
  return (
    <AuthGuard>
      <MemberListSection title="회원 목록" />
    </AuthGuard>
  );
}
