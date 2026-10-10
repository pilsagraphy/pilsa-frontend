import AuthGuard from '@/components/common/AuthGuard';
import DonationAdminSection from '@/components/service/adminOperations/DonationAdminSection';

export default function AdminDonationAdminSectionPage() {
  return (
    <AuthGuard>
      <DonationAdminSection />
    </AuthGuard>
  );
}
