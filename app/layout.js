import './globals.css';
import AuthBootstrap from '@/components/common/AuthBootstrap';

export const metadata = {
  title: 'pilsa-homepage',
  description: '필사 홈페이지',
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body className="min-h-screen bg-white text-neutral-900 flex flex-col">
        <AuthBootstrap>{children}</AuthBootstrap>
      </body>
    </html>
  );
}
