import AuthGuard from '@/components/common/AuthGuard';
import OrganizationEditorSection from '@/components/service/adminOperations/OrganizationEditorSection';

export default function AdminOrganizationPage() {
  return (
    <AuthGuard>
      <OrganizationEditorSection />
    </AuthGuard>
  );
}
