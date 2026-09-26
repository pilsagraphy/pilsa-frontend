import AuthGuard from '@/components/common/AuthGuard';
import MonitoringSection from '@/components/service/adminOperations/MonitoringSection';

export default function AdminMonitoringPage() {
  return (
    <AuthGuard>
      <MonitoringSection />
    </AuthGuard>
  );
}
