import AuthGuard from '@/components/common/AuthGuard';
import IntroAdminSection from '@/components/service/adminOperations/IntroAdminSection';

export default function AdminIntroAdminSectionPage() {
  return (
    <AuthGuard>
      <IntroAdminSection />
    </AuthGuard>
  );
}
