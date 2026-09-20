import './globals.css';
import AuthBootstrap from '@/components/common/AuthBootstrap';
import DesktopSiteNotice from '@/components/shared/DesktopSiteNotice';
import IosInstallGuide from '@/components/shared/IosInstallGuide';

export const metadata = {
  // 브라우저 탭·북마크·공유 카드에 그대로 나가는 이름이라 앱·스토어 표기와 같은 값을 쓴다
  title: 'Pilsagraphy',
  description: '필사그래피 동아리 홈페이지 — 게시판, 일정, 알림',
  // PWA — 이 manifest 가 있어야 홈 화면 설치와 TWA(플레이스토어 앱) 가 성립한다
  manifest: '/manifest.json',
  icons: {
    // PC 브라우저 탭 파비콘 — 흰 바탕 + 검정 로고 (app/favicon.ico 도 같은 그림, 16/32/48/64 프레임).
    // 앱·홈 화면 아이콘(검정 바탕)은 manifest.json 과 아래 apple 항목이 따로 담당한다 — 여기에 icon-192 를 걸면
    // 브라우저가 탭에도 검정 아이콘을 골라 쓴다(실제 그랬음).
    // favicon.svg 는 안에 라이트(흰 바탕 검정 로고)·다크(검정 바탕 흰 로고) 그림을 둘 다 넣고 prefers-color-scheme 으로
    // 바꾼다 — 크롬·엣지·파이어폭스가 SVG 를 우선 고른다. 사파리는 SVG 파비콘을 안 읽어 app/favicon.ico(라이트)로 간다.
    icon: [{ url: '/icons/favicon.svg', type: 'image/svg+xml' }],
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
  // 설치형 앱(TWA)의 상태바·내비게이션바 색이 이 값이 된다. 브랜드 색(#212121)을 넣었더니
  // 흰 바탕 화면 위아래로 검은 띠가 생겨(다른 앱에는 없는 모습) 화면 배경과 같은 흰색으로 맞춘다.
  // 아이콘 명암은 크롬이 색 밝기를 보고 알아서 뒤집는다 — 흰 바탕이면 어두운 아이콘.
  themeColor: '#ffffff',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <head>
        {/* 사이트 글꼴. 컴포넌트들이 font-['Pretendard'] 를 쓰는데 정작 불러오는 곳이 없어 시스템 글꼴로 떨어졌다.
            동적 서브셋이라 페이지에 나온 글자만 받는다. 폰트는 CDN 밖 요청이 아니라 CSP 걱정이 없다 */}
        <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard-dynamic-subset.min.css"
        />
      </head>
      <body className="min-h-screen bg-white font-sans text-neutral-900 flex flex-col">
        {/* 휴대폰인데 크롬 '데스크톱 사이트' 모드로 PC 화면이 그려질 때만 뜬다 (설치형 앱에서는 끌 방법이 없어 안내가 필요하다) */}
        <DesktopSiteNotice />
        {/* 아이폰으로 사이트 링크를 열고 들어온 사람에게 '홈 화면에 추가' 설치법 안내 (설치형 앱에서는 안 뜬다) */}
        <IosInstallGuide />
        <AuthBootstrap>{children}</AuthBootstrap>
      </body>
    </html>
  );
}
