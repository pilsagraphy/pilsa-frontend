import AuthGuard from '@/components/common/AuthGuard';
import GalleryAdminSection from '@/components/service/adminOperations/GalleryAdminSection';

export default function AdminGalleryPage() {
  return (
    <AuthGuard>
      <GalleryAdminSection />
    </AuthGuard>
  );
}
