import AuthGuard from '@/components/common/AuthGuard';
import AdminCalendarSection from '@/components/service/adminCalendar/AdminCalendarSection';

export default function AdminCalendarPage() {
  return (
    <AuthGuard>
      <AdminCalendarSection />
    </AuthGuard>
  );
}
