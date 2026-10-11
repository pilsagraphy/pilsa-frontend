import ClientToaster from '@/components/common/ClientToaster';
import AdminGuard from '@/components/common/AdminGuard';
import Header from '@/components/shared/Header';
import Footer from '@/components/shared/Footer';
import Sidebar from '@/components/shared/Sidebar';

export default function AdminLayout({ children }) {
  return (
    <>
      <ClientToaster />
      {/* 헤더 상단 고정: 스크롤해도 제자리 유지 */}
      <div className="tablet:sticky tablet:top-0 tablet:z-50 bg-surface">
        <Header />
      </div>

      {/* 1. flex-col(모바일: 세로) -> tablet:flex-row(태블릿 이상: 가로) -> desktop: 3칸 그리드 [사이드바 ≥240 | 본문 ≤1120 | 빈 칸]. 240+1120+240=1600 이라 1600px 이상에서 본문이 로고 기준 정확히 가운데, 그 아래는 사이드바 최소폭 때문에 오른쪽으로 치우친다 (PM 10/11, 검토 반영)
        2. relative를 추가하여 모바일 fixed 요소들의 기준점이 꼬이지 않게 함
      */}
      <div className="relative mx-auto flex w-full max-w-[1440px] flex-1 flex-col tablet:flex-row desktop:grid desktop:max-w-[1600px] desktop:grid-cols-[minmax(240px,1fr)_minmax(0,1120px)_minmax(0,1fr)]">
        {/* aside 제어:
          - 모바일: 기본적으로 공간을 차지하지 않거나 최소화함 (Sidebar 내부에서 fixed로 띄움)
          - tablet: sticky 적용 및 너비 고정
        */}
        <aside className="tablet:sticky tablet:top-[160px] tablet:h-[calc(100vh-160px)] tablet:overflow-y-auto">
          <Sidebar />
        </aside>

        <main className="flex-1 flex flex-col min-w-0">
          {/* 관리자 화면은 로그인 + 관리레벨(adminLevel >= 1) 둘 다 필요하므로 2차 검증 필터 추가 */}
          <div className="flex-1">
            <AdminGuard>{children}</AdminGuard>
          </div>
        </main>
      </div>

      {/* 푸터는 사이드바 옆이 아니라 아래 — 사이드바·본문 묶음 밖에서 전체 폭을 쓴다 (PM, 2026-09-20) */}
      <div className="w-full max-w-[1440px] mx-auto">
        <Footer />
      </div>
    </>
  );
}
