import AuthGuard from '@/components/common/AuthGuard';
import ReportListSection from '@/components/service/adminReports/ReportListSection';

export default function AdminReportsPage() {
  return (
    <AuthGuard>
      <ReportListSection title="신고 관리" />
    </AuthGuard>
  );
}
