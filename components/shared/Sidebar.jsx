'use client';

import React, { useCallback, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ChevronDown, X } from 'lucide-react';
import { toast } from 'sonner';
import useSidebarStore from '@/stores/sidebar';
import useAuthStore from '@/stores/useAuthStore';
import useBoardStore from '@/stores/useBoardStore';
import { ROUTES, ALLOWED_BOARD_MEMBER_TYPES, ADMIN_DRIVE_URL } from '@/constants/routes';
import { loginUrlWithReturnTo, stashReturnTo } from '@/lib/returnTo';
import { confirmDialog } from '@/stores/useDialogStore';

const Sidebar = () => {
  const router = useRouter();
  const pathname = usePathname();
  // 폰 사이드바 열림 — 여는 버튼이 헤더에 있어 스토어로 공유한다
  const isMobileOpen = useSidebarStore((s) => s.isMobileOpen);
  const openMobile = useSidebarStore((s) => s.openMobile);
  const closeMobile = useSidebarStore((s) => s.closeMobile);
  const setIsMobileOpen = (next) => (next ? openMobile() : closeMobile());

  const { openMenus, toggleMenu, toggleLogin } = useSidebarStore();
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  const memberType = useAuthStore((state) => state.memberType);
  const adminLevel = useAuthStore((state) => state.adminLevel);
  const fetchRole = useAuthStore((state) => state.fetchRole);

  const isAdmin = adminLevel >= 1; // 관리자(adminLevel 1~3)
  const isAdminArea = pathname.startsWith(ROUTES.ADMIN_HOME); // /admin 하위면 관리자 사이드바로 전환

  // 게시판 메뉴는 하드코딩하지 않고 GET /api/user/boards 결과로 그린다
  const boardData = useBoardStore((state) => state.data);
  const ensureBoards = useBoardStore((state) => state.ensureBoards);

  // 비로그인에게도 메뉴는 보여준다 — 서버가 이름·순서까지만 주고 canWrite 는 false 로 내려온다.
  // 메뉴를 누르면 checkBoardAccess 가 로그인 화면으로 보낸다.
  const boards = boardData;

  // 게시판 목록을 불러온다. 로그인 여부가 바뀌면 스토어가 캐시를 버리고 다시 받는다
  // (ownerUserId 비교 — 비로그인은 null 이라 로그인 직후 자동으로 갱신된다).
  useEffect(() => {
    ensureBoards();
  }, [isLoggedIn, ensureBoards]);

  // 페이지 이동 시 모바일 메뉴 닫기
  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  // 메뉴 링크를 누르면 경로가 바뀌든 말든 즉시 닫는다.
  // 위 effect 는 pathname 이 바뀔 때만 돌아서, 지금 보고 있는 페이지의 메뉴를 다시 누르거나
  // (예: /students 에서 '메인페이지') 이동이 막힌 경우(권한 없음 토스트)에는 사이드바가 그대로 남았다.
  // 펼침 버튼(ABOUT PILSA · 회원 게시판 · 관리자 메뉴)은 <button> 이라 여기에 걸리지 않는다.
  // 폰: 화면 어디서든 오른쪽으로 쓸면 사이드바가 열리고, 왼쪽으로 쓸면 닫힌다.
  // 처음엔 왼쪽 가장자리 24px 에서 시작한 손가락만 봤는데 가장자리를 정확히 잡기 어려웠다 (PM, 2026-09-21).
  // 세로 스크롤·가로 스크롤 표와 헷갈리지 않게 가로로 70px 넘게, 세로보다 1.5배 이상 움직였을 때만.
  const isMobileOpenRef = useRef(isMobileOpen);
  isMobileOpenRef.current = isMobileOpen;
  useEffect(() => {
    let start = null;
    const onStart = (event) => {
      const t = event.touches[0];
      start = t && window.innerWidth < 768 ? { x: t.clientX, y: t.clientY } : null;
    };
    const onEnd = (event) => {
      if (!start) return;
      const t = event.changedTouches[0];
      const dx = t.clientX - start.x;
      const dy = t.clientY - start.y;
      start = null;
      if (Math.abs(dx) < 70 || Math.abs(dx) <= Math.abs(dy) * 1.5) return;
      if (dx > 0 && !isMobileOpenRef.current) openMobile();
      else if (dx < 0 && isMobileOpenRef.current) closeMobile();
    };
    document.addEventListener('touchstart', onStart, { passive: true });
    document.addEventListener('touchend', onEnd, { passive: true });
    return () => {
      document.removeEventListener('touchstart', onStart);
      document.removeEventListener('touchend', onEnd);
    };
  }, [openMobile, closeMobile]);

  const closeOnLinkClick = useCallback((event) => {
    if (event.target.closest('a')) setIsMobileOpen(false);
  }, []);

  const checkBoardAccess = useCallback(async (targetPath) => {
    if (!isLoggedIn) {
      // 로그인 뒤 방금 누른 메뉴로 돌아가게 목적지를 들려 보낸다.
      // 여기서 e.preventDefault() 로 이동을 막기 때문에 페이지의 AuthGuard(returnTo 를 붙여 주는 쪽)까지 가지 않는다 —
      // 예전엔 그냥 /login 으로 보내서 로그인해도 게시판이 아니라 기본 화면으로 떨어졌다.
      router.push(loginUrlWithReturnTo(targetPath));
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
      const allowed = await checkBoardAccess(path);
      if (allowed) router.push(path);
    },
    [checkBoardAccess, router]
  );

  // 일반(비관리자 영역) 메뉴 구성.
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
  };

  // 게시판 하위 메뉴 = 메인페이지 + API 로 받은 게시판 목록 (displayOrder 순서 그대로)
  // exact: 하위 경로까지 활성으로 볼지. '메인페이지'(/students)는 게시판 경로까지 삼키므로 정확 일치만 쓴다.
  const boardSubMenus = [
    { name: '메인페이지', path: ROUTES.STUDENTS_DASHBOARD, exact: true },
    ...(boards ?? []).map((board) => ({
      name: board.boardName,
      path: ROUTES.BOARD(board.boardId),
    })),
  ];

  // 게시판은 목록 아래로 상세(/posts/{id})·글쓰기(/write)·수정 경로가 있어서
  // 정확 일치로 판정하면 그 화면들에서 현재 게시판 강조가 풀린다.
  // '/2' 가 '/20' 에 걸리지 않게 경계('/')를 붙여 비교한다.
  const isMenuActive = ({ path, exact }) =>
    exact ? pathname === path : pathname === path || pathname.startsWith(`${path}/`);

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
      {/* --- 모바일 전용 배경 오버레이 --- */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-[50] tablet:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* --- 사이드바 본체 --- */}
      <aside
        onClick={closeOnLinkClick}
        // 왼쪽으로 쓸어 닫기는 위 document 리스너가 화면 전체에서 처리한다
        className={`
          fixed top-0 left-0 h-[100dvh] overflow-y-auto overscroll-contain bg-white z-[60] flex flex-col border-r border-gray-100
          w-[210px] pl-9 py-6 tablet:w-[240px] tablet:pl-[80px] tablet:py-10
          transition-transform duration-300 ease-in-out
          tablet:h-full tablet:overflow-visible
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}
          tablet:translate-x-0 tablet:static tablet:z-auto tablet:border-none
        `}
      >
        {/* 모바일 내부 닫기 버튼 */}
        <button
          onClick={() => setIsMobileOpen(false)}
          className="absolute top-3 right-3 tablet:hidden p-2"
        >
          <X size={20} className="text-[#919191]" />
        </button>

        {isAdminArea ? (
          /* ===================== 관리자 사이드바 ===================== */
          <div className="flex shrink-0 flex-col gap-4 w-full items-start mt-8 tablet:gap-[26px] tablet:mt-0">
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

            {/* 이 주의 문장 (메인·마이페이지 인사말 옆에 뜨는 문장) */}
            <Link href={ROUTES.ADMIN_QUOTES}>
              <p className={singleLinkClass(pathname.startsWith(ROUTES.ADMIN_QUOTES))}>
                이 주의 문장
              </p>
            </Link>

            {/* 동아리 공용 드라이브 (외부 링크) — 새 탭으로 연다.
                편집 권한은 구글 드라이브 쪽 공유 설정이 정하는 것이라 앱에서는 열어 주는 것까지만 한다 */}
            <button
              type="button"
              className="text-left"
              onClick={async () => {
                // 확인 창이 사이드바 위에 겹치지 않게 먼저 닫는다
                setIsMobileOpen(false);
                const go = await confirmDialog(
                  '필사그래피 구글 드라이브로 이동됩니다.\n이동하시겠습니까?',
                  { confirmText: '이동', cancelText: '취소' }
                );
                if (go) window.open(ADMIN_DRIVE_URL, '_blank', 'noopener,noreferrer');
              }}
            >
              <p className={singleLinkClass(false)}>구글 드라이브</p>
            </button>

            {/* ABOUT 필사 링크는 뺐다 (2026-09-20 PM). 아래 '메인 페이지로 이동'이 그 역할을 한다 */}
          </div>
        ) : (
          /* ===================== 일반 사이드바 ===================== */
          <div className="flex shrink-0 flex-col gap-4 w-full items-start mt-8 tablet:gap-[26px] tablet:mt-0">
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
                  {boardSubMenus.map((menu) => (
                    <Link
                      key={menu.path}
                      href={menu.path}
                      onClick={(e) => handleBoardSubmenuClick(e, menu.path)}
                    >
                      <p
                        className={`text-[14px] cursor-pointer ${isMenuActive(menu) ? 'font-bold text-grayscale-06' : 'text-grayscale-03 hover:text-grayscale-06'}`}
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
            /* 관리자 영역: 회원 화면으로 돌아가는 길 + 로그아웃.
               관리자 사이드바에는 게시판·소개 메뉴가 없어, 이 링크가 없으면 주소를 직접 쳐야 나갈 수 있었다 */
            <>
              <Link href={ROUTES.STUDENTS_DASHBOARD}>
                <p className={bottomItemClass}>메인 페이지로 이동</p>
              </Link>
              <Link href={`${ROUTES.LOGIN}?logout=1`}>
                <button onClick={toggleLogin} className={bottomItemClass}>
                  로그아웃
                </button>
              </Link>
            </>
          ) : isLoggedIn ? (
            /* 로그인 상태: (관리자면) 관리자 페이지 이동 · 마이페이지 · 로그아웃.
               마이페이지는 헤더 프로필 아이콘과 겹친다고 한 번 뺐다가 다시 살렸다 (PM, 2026-09-21) */
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
            /* 비로그인: 로그인만. 이건 '지금 로그인하겠다' 는 뜻이라 보던 화면이 아니라 학생 홈으로 보낸다
               (게시판을 누르다 밀려난 경우는 위 checkBoardAccess 가 그 게시판을 returnTo 로 들려 보낸다).
               앞서 밀려나며 저장해 둔 목적지가 남아 있으면 지운다 — 안 지우면 엉뚱한 화면으로 돌아간다 */
            <Link href={ROUTES.LOGIN} onClick={() => stashReturnTo(null)}>
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
