import ClientToaster from '@/components/common/ClientToaster';
import Header from '@/components/shared/Header';
import Footer from '@/components/shared/Footer';
import Sidebar from '@/components/shared/Sidebar';
import MobileTabBar from '@/components/shared/MobileTabBar';

export default function PublicLayout({ children }) {
  return (
    <>
      <ClientToaster />
      {/* 헤더 상단 고정: 스크롤해도 제자리 유지 */}
      <div className="tablet:sticky tablet:top-0 tablet:z-50 bg-surface">
        <Header />
      </div>

      {/* 1. flex-col(모바일: 세로) -> tablet:flex-row(태블릿 이상: 가로) -> desktop: 3칸 그리드 [사이드바 ≥240 | 본문 ≤1016 | 빈 칸]. 양옆 칸이 1fr 로 같아지는 컨테이너 1496px(뷰포트 ≈1513) 이상에서 본문이 로고(화면 가운데) 기준으로 정확히 가운데 오고(1024~1495 는 사이드바 최소폭 240 때문에 예전처럼 +28~120px 오른쪽), 사이드바는 1600px 컨테이너의 왼쪽 끝에 붙는다 (PM 10/11)
        2. relative를 추가하여 모바일 fixed 요소들의 기준점이 꼬이지 않게 함
      */}
      <div className="relative mx-auto flex w-full max-w-[1440px] flex-1 flex-col tablet:flex-row desktop:grid desktop:max-w-[1600px] desktop:grid-cols-[minmax(240px,1fr)_minmax(0,1016px)_minmax(0,1fr)]">
        {/* aside 제어:
          - 모바일: 기본적으로 공간을 차지하지 않거나 최소화함 (Sidebar 내부에서 fixed로 띄움)
          - tablet: sticky 적용 및 너비 고정
        */}
        <aside className="tablet:sticky tablet:top-[160px] tablet:h-[calc(100vh-160px)] tablet:overflow-y-auto">
          <Sidebar />
        </aside>

        <main className="flex-1 flex flex-col min-w-0">
          <div className="flex-1">{children}</div>
        </main>
      </div>

      {/* 푸터는 사이드바 옆이 아니라 아래 — 사이드바·본문 묶음 밖에서 전체 폭을 쓴다 (PM, 2026-09-20) */}
      {/* 푸터 아래 여백은 폰 하단 탭 바 높이(--bottom-bar, 바가 있을 때만 값이 있다)만큼 — 바가 푸터를 가리지 않게 */}
      <div className="mx-auto w-full max-w-[1440px] pb-[var(--bottom-bar,0px)]">
        <Footer />
      </div>
      {/* 폰 하단 탭 바 — 768px 미만에서만 (PM 10/11 "여타 앱처럼 메뉴바가 아래에") */}
      <MobileTabBar />
    </>
  );
}
