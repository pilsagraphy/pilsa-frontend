'use client';

import React, { useCallback, useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ChevronDown, Menu, X } from 'lucide-react';
import { toast } from 'sonner';
import useSidebarStore from '@/stores/sidebar';
import useAuthStore from '@/stores/useAuthStore';
import { ROUTES, ALLOWED_BOARD_MEMBER_TYPES } from '@/constants/routes';

const Sidebar = () => {
  const router = useRouter();
  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const { openMenus, toggleMenu, toggleLogin } = useSidebarStore();
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  const memberType = useAuthStore((state) => state.memberType);
  const adminLevel = useAuthStore((state) => state.adminLevel);
  const fetchRole = useAuthStore((state) => state.fetchRole);

  // 페이지 이동 시 모바일 메뉴 닫기
  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  const checkBoardAccess = useCallback(async () => {
    if (!isLoggedIn) {
      router.push(ROUTES.LOGIN);
      return false;
    }
    // 신분(memberType) + 관리레벨(adminLevel) 2축 판정 — 스토어에 없으면 /api/role 재조회
    let currentMemberType = memberType;
    let currentAdminLevel = adminLevel;
    if (currentMemberType == null) {
      const data = await fetchRole();
      currentMemberType = data?.memberType ?? null;
      currentAdminLevel = data?.adminLevel ?? 0;
    }
    const allowed =
      currentAdminLevel >= 1 ||
      (currentMemberType && ALLOWED_BOARD_MEMBER_TYPES.includes(currentMemberType));
    if (!allowed) {
      toast.error('게시판 접근 권한이 없습니다.');
      return false;
    }
    return true;
  }, [isLoggedIn, memberType, adminLevel, fetchRole, router]);

  // 게시판 상위 메뉴는 단순 펼침/접힘 — 로그인 요구는 하위 메뉴(실제 페이지 이동) 클릭 시에만
  const handleBoardMenuClick = useCallback(() => {
    toggleMenu('board');
  }, [toggleMenu]);

  const handleBoardSubmenuClick = useCallback(
    async (e, path) => {
      e.preventDefault();
      const allowed = await checkBoardAccess();
      if (allowed) router.push(path);
    },
    [checkBoardAccess, router]
  );

  const menuConfig = {
    about: {
      subMenus: [
        { name: '동아리 소개', path: ROUTES.ABOUT_INTRO },
        { name: '연혁', path: ROUTES.ABOUT_HISTORY },
        { name: '브랜드CI', path: ROUTES.ABOUT_LOGO },
        { name: '명예의 전당', path: ROUTES.ABOUT_HONOR },
        { name: '역대회장', path: ROUTES.ABOUT_LEADER },
      ],
    },
    board: {
      subMenus: [
        { name: '메인페이지', path: ROUTES.STUDENTS_DASHBOARD },
        { name: '공지사항', path: ROUTES.NOTICES },
        { name: '자유게시판', path: ROUTES.FREE_BOARD },
        { name: '정보게시판', path: ROUTES.INFO_BOARD },
      ],
    },
  };

  const isAboutActive = pathname.startsWith(ROUTES.ABOUT);
  const isBoardActive = pathname.startsWith(ROUTES.STUDENTS_DASHBOARD);
  const loginText = isLoggedIn ? '로그아웃' : '로그인';
  const loginPath = isLoggedIn ? `${ROUTES.LOGIN}?logout=1` : ROUTES.LOGIN;

  return (
    <>
      {/* --- 모바일 전용 햄버거 버튼 --- */}
      {/* tablet(768px) 이상에서는 아예 사라짐 */}
      {!isMobileOpen && (
        <div className="fixed top-10 left-6 z-[40] tablet:hidden">
          <button
            onClick={() => setIsMobileOpen(true)}
            className="p-3 bg-white border border-gray-200 rounded-xl shadow-lg active:scale-95 transition-all"
          >
            <Menu size={24} className="text-[#212121]" />
          </button>
        </div>
      )}

      {/* --- 모바일 전용 배경 오버레이 --- */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-[50] tablet:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* --- 사이드바 본체 --- */}
      <aside
        className={`
          fixed top-0 left-0 h-full bg-white z-[60] flex flex-col pl-[80px] py-10 font-['Pretendard'] border-r border-gray-100
          w-[260px] transition-transform duration-300 ease-in-out
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'} 
          tablet:translate-x-0 tablet:static tablet:w-[240px] tablet:z-auto tablet:border-none
        `}
      >
        {/* 모바일 내부 닫기 버튼 */}
        <button
          onClick={() => setIsMobileOpen(false)}
          className="absolute top-6 right-6 tablet:hidden p-2"
        >
          <X size={20} className="text-[#919191]" />
        </button>

        <div className="flex flex-col gap-[26px] w-full items-start mt-10 tablet:mt-0">
          {/* 1. ABOUT PILSA */}
          <div className="w-full flex flex-col items-start">
            <button
              onClick={() => toggleMenu('about')}
              className={`flex items-center text-[16px] ${isAboutActive ? 'font-bold text-grayscale-06' : 'font-medium text-grayscale-03'}`}
            >
              <ArrowIcon isOpen={openMenus.about} />
              ABOUT PILSA
            </button>
            {openMenus.about && (
              <div className="flex flex-col items-start gap-[15px] mt-3">
                {menuConfig.about.subMenus.map((menu) => (
                  <Link key={menu.name} href={menu.path}>
                    <p
                      className={`text-[14px] cursor-pointer ${pathname === menu.path ? 'font-bold text-grayscale-06' : 'text-grayscale-03 hover:text-grayscale-06'}`}
                    >
                      {menu.name}
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* 2. 게시판 */}
          <div className="w-full flex flex-col items-start">
            <button
              onClick={handleBoardMenuClick}
              className={`flex items-center text-[16px] ${isBoardActive ? 'font-bold text-grayscale-06' : 'font-medium text-grayscale-03'}`}
            >
              <ArrowIcon isOpen={openMenus.board} />
              회원 게시판
            </button>
            {openMenus.board && (
              <div className="flex flex-col items-start gap-[15px] mt-3">
                {menuConfig.board.subMenus.map((menu) => (
                  <Link
                    key={menu.name}
                    href={menu.path}
                    onClick={(e) => handleBoardSubmenuClick(e, menu.path)}
                  >
                    <p
                      className={`text-[14px] cursor-pointer ${pathname === menu.path ? 'font-bold text-grayscale-06' : 'text-grayscale-03 hover:text-grayscale-06'}`}
                    >
                      {menu.name}
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* 3. 단일 메뉴들 */}
          <Link href="/calendar">
            <p
              className={`text-[16px] font-bold ${pathname === '/calendar' ? 'text-grayscale-06' : 'text-grayscale-03 hover:text-grayscale-06'}`}
            >
              일정 달력
            </p>
          </Link>
          <Link href={ROUTES.GALLERY}>
            <p
              className={`text-[16px] font-bold ${pathname === ROUTES.GALLERY ? 'text-grayscale-06' : 'text-grayscale-03 hover:text-grayscale-06'}`}
            >
              활동 사진들
            </p>
          </Link>
          <Link href={ROUTES.GUESTBOOK}>
            <p
              className={`text-[16px] font-bold ${pathname === ROUTES.GUESTBOOK ? 'text-grayscale-06' : 'text-grayscale-03 hover:text-grayscale-06'}`}
            >
              방명록
            </p>
          </Link>
        </div>

        {/* 방명록 ↔ 마이페이지(로그인) 간격: 최대 130px, 최소 40px, 그보다 좁아지면 스크롤 */}
        <div className="flex-1 min-h-[40px] max-h-[130px]" aria-hidden />

        {/* 4. 로그인 / 마이페이지 영역 */}
        <div className="flex flex-col items-start gap-4">
          {/* 로그인 상태에서만 마이페이지 노출 */}
          {isLoggedIn && (
            <Link href={ROUTES.MY_PAGE}>
              <p className="text-[16px] font-bold text-[#212121] hover:underline">마이페이지</p>
            </Link>
          )}
          <Link href={loginPath}>
            <button
              onClick={toggleLogin}
              className="text-[16px] font-bold text-[#212121] hover:underline"
            >
              {loginText}
            </button>
          </Link>
        </div>
      </aside>
    </>
  );
};

const ArrowIcon = ({ isOpen }) => (
  <span className="-ml-6 flex size-6 shrink-0 items-center justify-center">
    <ChevronDown
      size={16}
      strokeWidth={2.5}
      className={`transition-transform duration-200 text-grayscale-03 ${isOpen ? 'rotate-180' : 'rotate-0'}`}
    />
  </span>
);

export default Sidebar;
