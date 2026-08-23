import AuthGuard from '@/components/common/AuthGuard';
import PenaltyDashboardSection from '@/components/service/memberPenalty/PenaltyDashboardSection';

export default function AdminMemberPenaltyPage() {
  return (
    <AuthGuard>
      <PenaltyDashboardSection />
    </AuthGuard>
  );
}
