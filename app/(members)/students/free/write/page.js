import FreeWrite from '@/components/service/freeWrite/FreeWrite';
import AuthGuard from '@/components/common/AuthGuard';
export default function FreeWritePage() {
  return (
    <AuthGuard>
      <FreeWrite />
    </AuthGuard>
  );
}
