import AuthGuard from '@/components/common/AuthGuard';
import HistoryAdminSection from '@/components/service/adminOperations/HistoryAdminSection';

export default function AdminHistoryAdminSectionPage() {
  return (
    <AuthGuard>
      <HistoryAdminSection />
    </AuthGuard>
  );
}
