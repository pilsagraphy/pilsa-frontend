import AuthGuard from '@/components/common/AuthGuard';
import PolicySettingsSection from '@/components/service/adminOperations/PolicySettingsSection';

export default function AdminPoliciesPage() {
  return (
    <AuthGuard>
      <PolicySettingsSection />
    </AuthGuard>
  );
}
