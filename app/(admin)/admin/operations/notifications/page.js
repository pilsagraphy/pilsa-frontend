import AuthGuard from '@/components/common/AuthGuard';
import NotificationSettingsSection from '@/components/service/adminOperations/NotificationSettingsSection';

export default function AdminNotificationSettingsPage() {
  return (
    <AuthGuard>
      <NotificationSettingsSection />
    </AuthGuard>
  );
}
