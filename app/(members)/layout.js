import ClientToaster from '@/components/common/ClientToaster';
import Header from '@/components/shared/Header';
import Footer from '@/components/shared/Footer';
import Sidebar from '@/components/shared/Sidebar';

export default function MembersLayout({ children }) {
  return (
    <>
      <ClientToaster />
      {/* 헤더 상단 고정: 스크롤해도 제자리 유지 */}
      <div className="tablet:sticky tablet:top-0 tablet:z-50 bg-white">
        <Header />
      </div>

      {/* 1. flex-col(모바일: 세로) -> tablet:flex-row(태블릿 이상: 가로) 
        2. relative를 추가하여 모바일 fixed 요소들의 기준점이 꼬이지 않게 함
      */}
      <div className="flex flex-col tablet:flex-row flex-1 w-full max-w-[1440px] mx-auto relative">
        {/* aside 제어:
          - 모바일: 기본적으로 공간을 차지하지 않거나 최소화함 (Sidebar 내부에서 fixed로 띄움)
          - tablet: sticky 적용 및 너비 고정
        */}
        <aside className="tablet:sticky tablet:top-[160px] tablet:h-[calc(100vh-160px)] tablet:overflow-y-auto">
          <Sidebar />
        </aside>

        <main className="flex-1 flex flex-col min-w-0">
          <div className="flex-1">{children}</div>
          <Footer />
        </main>
      </div>
    </>
  );
}
