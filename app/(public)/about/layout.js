import ClientToaster from '@/components/common/ClientToaster';
import Header from '@/components/shared/Header';
import Footer from '@/components/shared/Footer';
import Sidebar from '@/components/shared/Sidebar';

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body className={`min-h-screen bg-white text-neutral-900 flex flex-col`}>
        <ClientToaster />
        <Header />

        <div className="flex flex-1 w-full max-w-[1440px] mx-auto">
          <aside className="sticky top-[80px] h-[calc(100vh-80px)] overflow-y-auto">
            <Sidebar />
          </aside>

          <main className="flex-1 flex flex-col min-w-0">
            <div className="flex-1">{children}</div>
            <Footer />
          </main>
        </div>
      </body>
    </html>
  );
}
