import ClientToaster from '@/components/common/ClientToaster';
import Header from '@/components/shared/Header';
import Footer from '@/components/shared/Footer';
import Sidebar from '@/components/shared/Sidebar';

export default function AuthLayout({ children }) {
  return (
    <>
      <ClientToaster />
      <Header />

      <main className="flex-1 flex flex-col min-w-0">
        <div className="flex-1">{children}</div>
        <Footer />
      </main>
    </>
  );
}
