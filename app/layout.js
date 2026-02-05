import './globals.css';

export const metadata = {
  title: 'pilsa-homepage',
  description: '필사 홈페이지',
};

export default function RootLayout({ children }) {
  return (
    <html lang="kor">
      <body>{children}</body>
    </html>
  );
}
