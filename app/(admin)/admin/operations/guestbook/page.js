import AuthGuard from '@/components/common/AuthGuard';
import GuestbookAdminSection from '@/components/service/adminOperations/GuestbookAdminSection';

export default function AdminGuestbookPage() {
  return (
    <AuthGuard>
      <GuestbookAdminSection />
    </AuthGuard>
  );
}
