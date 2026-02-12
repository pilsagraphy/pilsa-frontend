import ClientToaster from '@/components/common/ClientToaster';
import './globals.css';
import Header from '@/components/shared/Header';
import Footer from '@/components/shared/Footer';
import Line from '@/components/shared/Line';

export const metadata = {
  title: 'pilsa-homepage',
  description: '필사 홈페이지',
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body className={`min-h-screen bg-white text-neutral-900`}>
        <ClientToaster />
        <Header />
        <div className="mx-auto w-full max-w-[1160px] px-2.5 lg:px-24">
          <Line />
        </div>

        <main className="mx-auto w-full">
          {children}
          <Footer />
        </main>
      </body>
    </html>
  );
}
