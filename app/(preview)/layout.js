import ClientToaster from '@/components/common/ClientToaster';
import Header from '@/components/shared/Header';
import Footer from '@/components/shared/Footer';
import Sidebar from '@/components/shared/Sidebar';

// 관리자 화면 마크업 확인용 껍데기 (개발 환경 전용)
// (admin) 레이아웃과 같은 구성이지만 AdminGuard가 없어서 로그인 없이도 열린다.
// 사이드바는 관리자 메뉴로 고정한다. (경로가 /admin 하위가 아니라 자동 판정이 안 된다)
// TODO: 리뷰 확인이 끝나면 이 그룹은 통째로 삭제할 것.
export default function PreviewLayout({ children }) {
  return (
    <>
      <ClientToaster />
      <div className="tablet:sticky tablet:top-0 tablet:z-50 bg-white">
        <Header />
      </div>

      <div className="flex flex-col tablet:flex-row flex-1 w-full max-w-[1440px] mx-auto relative">
        <aside className="tablet:sticky tablet:top-[160px] tablet:h-[calc(100vh-160px)] tablet:overflow-y-auto">
          <Sidebar forceAdminMenu />
        </aside>

        <main className="flex-1 flex flex-col min-w-0">
          <div className="flex-1">{children}</div>
          <Footer />
        </main>
      </div>
    </>
  );
}
