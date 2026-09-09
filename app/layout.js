import './globals.css';
import Script from 'next/script';
import AuthBootstrap from '@/components/common/AuthBootstrap';
import DesktopSiteNotice from '@/components/shared/DesktopSiteNotice';

export const metadata = {
  title: 'pilsa-homepage',
  description: '필사 홈페이지',
  // PWA — 이 manifest 가 있어야 홈 화면 설치와 TWA(플레이스토어 앱) 가 성립한다
  manifest: '/manifest.json',
  icons: {
    icon: '/icons/icon-192.png',
    apple: '/icons/apple-touch-icon.png',
  },
  // iOS 는 manifest 의 display 를 안 읽는다. 홈 화면에서 전체화면으로 뜨게 하려면 이 메타가 필요하고,
  // lib/push.js 의 isStandalone() 이 보는 navigator.standalone 도 이 설정이 있어야 true 가 된다.
  appleWebApp: {
    capable: true,
    title: 'Pilsagraphy',
    statusBarStyle: 'default',
  },
};

export const viewport = {
  // 브랜드 CI 색 (components/service/brandCI/BrandColor.jsx). TWA 상태바 색이 된다.
  // 스플래시는 manifest 의 background_color(흰색) 를 쓴다 — 앱 화면이 흰 바탕이라 그쪽은 맞춰 둔다.
  themeColor: '#212121',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body className="min-h-screen bg-white text-neutral-900 flex flex-col">
        {/* 모바일 축소 배율을 화면 폭에 비례해 정한다 — 폰마다 폭이 달라 고정 배율이면 기기별로 크기가 제각각이다.
            목표: 어느 폰이든 가로 515css px 짜리 화면처럼 보이게 (412px 폰 = 0.8). 0.7~1 로 클램프.
            768px 이상은 globals.css 미디어 쿼리가 zoom 을 안 걸므로 1 로 둔다. 첫 페인트 전에 돌아야 해서 beforeInteractive. */}
        <Script id="mobile-ui-zoom" strategy="beforeInteractive">{`
          (function () {
            var TARGET = 515, MIN = 0.7, MAX = 1;
            var root = document.documentElement;
            function apply() {
              var mobile = window.matchMedia('(max-width: 767px)').matches;
              // innerWidth 는 html zoom 의 영향을 받을 수 있어(vw 가 줄어드는 것과 같은 이유) zoom 과 무관한 screen.width 를 쓴다
              var z = mobile ? Math.min(MAX, Math.max(MIN, window.screen.width / TARGET)) : 1;
              root.style.setProperty('--mobile-ui-zoom', z.toFixed(3));
            }
            apply();
            window.addEventListener('resize', apply);
          })();
        `}</Script>
        {/* 휴대폰인데 크롬 '데스크톱 사이트' 모드로 PC 화면이 그려질 때만 뜬다 (설치형 앱에서는 끌 방법이 없어 안내가 필요하다) */}
        <DesktopSiteNotice />
        <AuthBootstrap>{children}</AuthBootstrap>
      </body>
    </html>
  );
}
