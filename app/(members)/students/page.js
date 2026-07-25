import StudentsDashboardSection from '@/components/service/studentDashboard/StudentsDashboardSection';
import AuthGuard from '@/components/common/AuthGuard';

export default function StudentsDashboard() {
  return (
    <AuthGuard>
      <StudentsDashboardSection />
    </AuthGuard>
  );
}
