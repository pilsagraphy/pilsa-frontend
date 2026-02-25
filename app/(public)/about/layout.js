import ClientToaster from '@/components/common/ClientToaster';
import Header from '@/components/shared/Header';
import Footer from '@/components/shared/Footer';

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body className={`min-h-screen bg-white text-neutral-900`}>
        <ClientToaster />
        <Header />

        <main className="mx-auto w-full">
          {children}
          <Footer />
        </main>
      </body>
    </html>
  );
}
