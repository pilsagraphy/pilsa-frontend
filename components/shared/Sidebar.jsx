'use client';

import React, { useCallback, useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ChevronDown, Menu, X } from 'lucide-react';
import { toast } from 'sonner';
import useSidebarStore from '@/stores/sidebar';
import useAuthStore from '@/stores/useAuthStore';
import { ROUTES, ALLOWED_BOARD_MEMBER_TYPES } from '@/constants/routes';

// forceAdminMenu: 경로와 상관없이 관리자 메뉴로 그린다. (개발용 미리보기 화면에서만 사용)
const Sidebar = ({ forceAdminMenu = false }) => {
  const router = useRouter();
  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const { openMenus, toggleMenu, toggleLogin } = useSidebarStore();
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  const memberType = useAuthStore((state) => state.memberType);
  const adminLevel = useAuthStore((state) => state.adminLevel);
  const fetchRole = useAuthStore((state) => state.fetchRole);

  const isAdmin = adminLevel >= 1; // 관리자(adminLevel 1~3)
  const isAdminArea = forceAdminMenu || pathname.startsWith(ROUTES.ADMIN_HOME); // /admin 하위면 관리자 사이드바로 전환

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

  // 일반(비관리자 영역) 메뉴 구성. 게시판 하위는 다음 작업에서 /api/user/boards로 통합 예정 — 지금은 유지.
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

  // 관리자 영역 펼침 메뉴 구성
  const adminMenuConfig = {
    members: {
      label: '회원관리',
      subMenus: [
        { name: '회원목록', path: ROUTES.ADMIN_MEMBER_LIST },
        { name: '제재 회원 관리', path: ROUTES.ADMIN_MEMBER_PENALTY },
      ],
    },
    community: {
      label: '커뮤니티 관리',
      subMenus: [
        { name: '게시판 관리', path: ROUTES.ADMIN_BOARDS },
        { name: '게시글 관리', path: ROUTES.ADMIN_POSTS },
        { name: '댓글 관리', path: ROUTES.ADMIN_COMMENTS },
        { name: '신고 관리', path: ROUTES.ADMIN_REPORTS },
      ],
    },
  };

  const isAboutActive = pathname.startsWith(ROUTES.ABOUT);
  const isBoardActive = pathname.startsWith(ROUTES.STUDENTS_DASHBOARD);
  const isMembersActive = pathname.startsWith(ROUTES.ADMIN_MEMBERS);
  const isCommunityActive = pathname.startsWith(`${ROUTES.ADMIN_HOME}/community`);

  // 단일 링크 색상 (선택: grayscale-06 / 미선택: grayscale-03)
  const singleLinkClass = (active) =>
    `text-[16px] font-bold ${active ? 'text-grayscale-06' : 'text-grayscale-03 hover:text-grayscale-06'}`;
  // 로그인/마이페이지/관리자 이동 등 하단 영역 공통 스타일
  const bottomItemClass = 'text-[16px] font-bold text-[#212121] hover:underline';

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

        {isAdminArea ? (
          /* ===================== 관리자 사이드바 ===================== */
          <div className="flex flex-col gap-[26px] w-full items-start mt-10 tablet:mt-0">
            {/* 관리자홈 */}
            <Link href={ROUTES.ADMIN_HOME}>
              <p className={singleLinkClass(pathname === ROUTES.ADMIN_HOME)}>관리자홈</p>
            </Link>

            {/* 회원관리 / 커뮤니티 관리 (펼침 메뉴) */}
            {[
              { key: 'members', active: isMembersActive },
              { key: 'community', active: isCommunityActive },
            ].map(({ key, active }) => {
              const cfg = adminMenuConfig[key];
              return (
                <div key={key} className="w-full flex flex-col items-start">
                  <button
                    onClick={() => toggleMenu(key)}
                    className={`flex items-center text-[16px] ${active ? 'font-bold text-grayscale-06' : 'font-medium text-grayscale-03'}`}
                  >
                    <ArrowIcon isOpen={openMenus[key]} />
                    {cfg.label}
                  </button>
                  {openMenus[key] && (
                    <div className="flex flex-col items-start gap-[15px] mt-3">
                      {cfg.subMenus.map((menu) => (
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
              );
            })}

            {/* 일정 달력 관리 */}
            <Link href={ROUTES.ADMIN_CALENDAR}>
              <p className={singleLinkClass(pathname.startsWith(ROUTES.ADMIN_CALENDAR))}>
                일정 달력 관리
              </p>
            </Link>

            {/* ABOUT 필사 (공개 소개 영역으로 이동 → 일반 사이드바로 복귀) */}
            <Link href={ROUTES.ABOUT}>
              <p className={singleLinkClass(false)}>ABOUT 필사</p>
            </Link>
          </div>
        ) : (
          /* ===================== 일반 사이드바 ===================== */
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

            {/* 2. 회원 게시판 */}
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
            <Link href={ROUTES.CALENDAR}>
              <p className={singleLinkClass(pathname === ROUTES.CALENDAR)}>일정 달력</p>
            </Link>
            <Link href={ROUTES.GALLERY}>
              <p className={singleLinkClass(pathname === ROUTES.GALLERY)}>활동 사진들</p>
            </Link>
            <Link href={ROUTES.GUESTBOOK}>
              <p className={singleLinkClass(pathname === ROUTES.GUESTBOOK)}>방명록</p>
            </Link>
          </div>
        )}

        {/* 상단 메뉴 ↔ 하단 영역 간격: 최대 130px, 최소 40px, 그보다 좁아지면 스크롤 */}
        <div className="flex-1 min-h-[40px] max-h-[130px]" aria-hidden />

        {/* 하단 영역 */}
        <div className="flex flex-col items-start gap-4">
          {isAdminArea ? (
            /* 관리자 영역: 로그아웃만 */
            <Link href={`${ROUTES.LOGIN}?logout=1`}>
              <button onClick={toggleLogin} className={bottomItemClass}>
                로그아웃
              </button>
            </Link>
          ) : isLoggedIn ? (
            /* 로그인 상태: (관리자면) 관리자 페이지 이동 · 마이페이지 · 로그아웃 */
            <>
              {isAdmin && (
                <Link href={ROUTES.ADMIN_HOME}>
                  <p className={bottomItemClass}>관리자 페이지 이동</p>
                </Link>
              )}
              <Link href={ROUTES.MY_PAGE}>
                <p className={bottomItemClass}>마이페이지</p>
              </Link>
              <Link href={`${ROUTES.LOGIN}?logout=1`}>
                <button onClick={toggleLogin} className={bottomItemClass}>
                  로그아웃
                </button>
              </Link>
            </>
          ) : (
            /* 비로그인: 로그인만 */
            <Link href={ROUTES.LOGIN}>
              <button onClick={toggleLogin} className={bottomItemClass}>
                로그인
              </button>
            </Link>
          )}
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
