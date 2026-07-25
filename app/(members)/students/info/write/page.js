import InfoWrite from '@/components/service/infowrite/InfoWrite';
import AuthGuard from '@/components/common/AuthGuard';
export default function InfoWritePage() {
  return (
    <AuthGuard>
      <InfoWrite />
    </AuthGuard>
  );
}
