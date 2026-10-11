'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BookOpenText, Home, LayoutList, LogIn, MessagesSquare, MoreHorizontal, PanelsTopLeft, SlidersHorizontal, Sparkles, UserRound, Users } from 'lucide-react';
import useAuthStore from '@/stores/useAuthStore';
import useBoardStore from '@/stores/useBoardStore';
import { ADMIN_DRIVE_URL, ROUTES } from '@/constants/routes';
import { confirmDialog } from '@/stores/useDialogStore';

// 폰 하단 탭 바 (PM 2026-10-11 "여타 앱처럼 메뉴바가 아래에") — 768px(tablet) 미만에서만 보인다.
// 회원 영역(PM 지정): 홈 · 게시판 · 활동(일정/사진/방명록) · ABOUT(소개/연혁/브랜드CI/명예의 전당/역대회장) · 마이페이지(비로그인은 로그인).
// 관리자 영역(/admin, PM 지정 순서): 홈(관리자 홈/메인 홈 선택창) · 회원 · 커뮤니티 · 운영 · 메뉴 — 사이드바 드로어는 열지 않는다(헤더 햄버거가 맡는다).
// 묶음 탭은 누르면 바 바로 위에 선택창이 뜬다 — 같은 탭을 다시 누르거나 바깥을 누르면 닫히고, 이동하면 닫힌다.
// 게시판 목록은 사이드바처럼 GET /api/user/boards(useBoardStore)로 그린다(하드코딩 금지).
// 드로어(z-60)와 그 어둡게(z-50)보다 아래(z-40)라 드로어가 열리면 가려진다. 바 높이만큼은 layout 이 --bottom-bar 로 비워 둔다.
export const TAB_BAR_HEIGHT = 56;

const ABOUT_ITEMS = [
  { name: '동아리 소개', path: ROUTES.ABOUT_INTRO },
  { name: '연혁', path: ROUTES.ABOUT_HISTORY },
  { name: '브랜드CI', path: ROUTES.ABOUT_LOGO },
  { name: '명예의 전당', path: ROUTES.ABOUT_HONOR },
  { name: '역대회장', path: ROUTES.ABOUT_LEADER },
];
const ACTIVITY_ITEMS = [
  { name: '일정 달력', path: ROUTES.CALENDAR },
  { name: '활동 사진들', path: ROUTES.GALLERY },
  { name: '방명록', path: ROUTES.GUESTBOOK },
];

// 홈 탭 — 관리자 계정은 누르면 '관리자 홈 / 메인 홈' 선택창, 일반 회원은 메인 홈으로 바로 (PM 10/11). 회원·관리자 영역 둘 다 같다
const homeTab = (isAdmin) =>
  isAdmin
    ? {
        key: 'home',
        label: '홈',
        icon: Home,
        title: '홈',
        items: [
          { name: '관리자 홈', path: ROUTES.ADMIN_HOME, exact: true },
          { name: '메인 홈', path: ROUTES.STUDENTS_DASHBOARD, exact: true },
        ],
      }
    : { key: 'home', label: '홈', href: ROUTES.STUDENTS_DASHBOARD, icon: Home, exact: true };

// 관리자 묶음 — 사이드바(Sidebar.jsx adminMenuConfig)와 같은 항목. 정책 설정은 관리 레벨 3 전용
const adminTabs = (adminLevel) => [
  homeTab(true),
  {
    key: 'members',
    label: '회원',
    icon: Users,
    title: '회원 관리',
    items: [
      { name: '회원목록', path: ROUTES.ADMIN_MEMBER_LIST },
      { name: '제재 회원 관리', path: ROUTES.ADMIN_MEMBER_PENALTY },
    ],
  },
  {
    key: 'community',
    label: '커뮤니티',
    icon: MessagesSquare,
    title: '커뮤니티 관리',
    items: [
      { name: '게시판 관리', path: ROUTES.ADMIN_BOARDS },
      { name: '게시글 관리', path: ROUTES.ADMIN_POSTS },
      { name: '댓글 관리', path: ROUTES.ADMIN_COMMENTS },
      { name: '신고 관리', path: ROUTES.ADMIN_REPORTS },
    ],
  },
  {
    key: 'operations',
    label: '운영',
    icon: SlidersHorizontal,
    title: '운영 관리',
    items: [
      { name: '모니터링', path: ROUTES.ADMIN_MONITORING },
      ...(adminLevel >= 3 ? [{ name: '정책 설정', path: ROUTES.ADMIN_POLICIES }] : []),
      { name: '알림 설정', path: ROUTES.ADMIN_NOTIFICATION_SETTINGS },
      { name: '일정 달력 관리', path: ROUTES.ADMIN_CALENDAR },
      { name: '이 주의 문장', path: ROUTES.ADMIN_QUOTES },
    ],
  },
  {
    key: 'menus',
    label: '메뉴',
    icon: PanelsTopLeft,
    title: '메뉴 관리',
    items: [
      { name: '동아리 소개 관리', path: ROUTES.ADMIN_INTRO },
      { name: '연혁 관리', path: ROUTES.ADMIN_HISTORY },
      { name: '조직도 편집', path: ROUTES.ADMIN_ORGANIZATION },
      { name: '명예의 전당 관리', path: ROUTES.ADMIN_DONATIONS },
      { name: '활동 사진 관리', path: ROUTES.ADMIN_GALLERY },
      { name: '방명록 관리', path: ROUTES.ADMIN_GUESTBOOK },
    ],
  },
  // 기타 — 맨 오른쪽: 구글 드라이브(외부, 확인 창 뒤 새 탭) · 마이페이지 (PM 2026-10-11 '기타를 맨 오른쪽에')
  {
    key: 'etc',
    label: '기타',
    icon: MoreHorizontal,
    title: '기타',
    items: [
      { name: '구글 드라이브', external: ADMIN_DRIVE_URL },
      { name: '마이페이지', path: ROUTES.MY_PAGE },
    ],
  },
];

// 하위 경로(게시판 글 상세 등)도 그 항목이 켜진 것으로 본다
const within = (pathname, path) => pathname === path || pathname.startsWith(`${path}/`);

export default function MobileTabBar() {
  const pathname = usePathname();
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);
  const adminLevel = useAuthStore((s) => s.adminLevel);
  const boards = useBoardStore((s) => s.data);
  const ensureBoards = useBoardStore((s) => s.ensureBoards);
  const [open, setOpen] = useState(null); // 열린 선택창의 탭 key

  // 바가 떠 있는 동안 html 에 has-tabbar 를 붙인다 → globals.css 의 --bottom-bar 가 바 높이가 되어, 바닥 고정 UI(글쓰기 버튼)·푸터 여백이 그만큼 올라간다.
  // (auth) 레이아웃처럼 바가 없는 화면에서는 0 이라 아무것도 안 밀린다
  useEffect(() => {
    document.documentElement.classList.add('has-tabbar');
    return () => document.documentElement.classList.remove('has-tabbar');
  }, []);
  // 게시판 목록 — 사이드바와 같은 스토어라 이미 받아 뒀으면 다시 안 받는다. 로그인 여부가 바뀌면 스토어가 캐시를 버린다
  useEffect(() => {
    ensureBoards();
  }, [isLoggedIn, ensureBoards]);
  // 이동하면 선택창을 닫는다
  useEffect(() => {
    setOpen(null);
  }, [pathname]);
  // 바 바깥(본문)을 누르면 닫는다 — 화면을 덮는 투명 막 대신 document 리스너로. 막을 깔았더니 폰에서 다른 탭을 눌렀을 때
  // 막이 먼저 닫히기만 하고 이동이 안 되는 일이 있었다 (PM 10/11). 바 안쪽(다른 탭·항목)은 각자의 onClick 이 처리한다
  const navRef = useRef(null);
  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => {
      if (navRef.current && !navRef.current.contains(e.target)) setOpen(null);
    };
    document.addEventListener('pointerdown', onDown, true);
    return () => document.removeEventListener('pointerdown', onDown, true);
  }, [open]);

  const isAdminArea = pathname.startsWith(ROUTES.ADMIN_HOME);
  const boardItems = (boards ?? []).map((b) => ({ name: b.boardName, path: ROUTES.BOARD(b.boardId) }));
  const isAdmin = (adminLevel ?? 0) >= 1;
  // 관리자 탭은 관리자 계정일 때만 — 비로그인·일반 회원이 /admin 주소로 들어와 AdminGuard 가 돌려보내기 전까지 관리 링크가 보이지 않게 (검토 지적)
  const tabs = isAdminArea && isAdmin
    ? adminTabs(adminLevel ?? 0)
    : [
        homeTab(isAdmin),
        { key: 'boards', label: '게시판', icon: LayoutList, title: '회원 게시판', items: boardItems, emptyText: '게시판 목록을 불러오는 중이에요.' },
        { key: 'activity', label: '활동', icon: Sparkles, title: '일정 · 사진 · 방명록', items: ACTIVITY_ITEMS },
        { key: 'about', label: 'ABOUT', icon: BookOpenText, title: 'ABOUT PILSA', items: ABOUT_ITEMS },
        isLoggedIn
          ? { key: 'mypage', label: '마이페이지', href: ROUTES.MY_PAGE, icon: UserRound }
          : { key: 'login', label: '로그인', href: ROUTES.LOGIN, icon: LogIn },
      ];

  const tabActive = (t) => {
    // 홈 묶음의 '관리자 홈'(/admin)은 정확히 일치할 때만 — 하위 관리 화면에서까지 홈이 켜지지 않게
    if (t.items) return t.items.some((it) => (it.exact ? pathname === it.path : within(pathname, it.path)));
    if (!t.href) return false;
    return t.exact ? pathname === t.href : within(pathname, t.href);
  };
  const openTab = tabs.find((t) => t.key === open && t.items);

  const itemClass = (active) =>
    `flex h-full min-w-0 flex-1 flex-col items-center justify-center gap-[3px] text-[11px] tracking-[-0.02em] transition-colors ${
      active ? 'font-semibold text-ink' : 'text-ink-3 active:text-ink'
    }`;

  return (
    <nav
      ref={navRef}
      aria-label="하단 메뉴"
      className="fixed inset-x-0 bottom-0 z-40 tablet:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      {openTab && (
        <div
          role="menu"
          aria-label={openTab.title}
          className="absolute inset-x-3 bottom-[calc(100%_+_10px)] z-10 overflow-hidden rounded-[14px] border border-line bg-elevated shadow-[0_8px_30px_rgba(0,0,0,0.18)]"
        >
          <p className="px-4 pb-1 pt-3 text-[11px] font-semibold tracking-[-0.02em] text-ink-3">{openTab.title}</p>
          {openTab.items.length === 0 ? (
            <p className="px-4 pb-4 pt-1 text-[13px] text-ink-3">{openTab.emptyText}</p>
          ) : (
            <ul className="max-h-[60dvh] overflow-y-auto pb-2">
              {openTab.items.map((it) => (
                <li key={it.path ?? it.external}>
                  {it.external ? (
                    <button
                      type="button"
                      role="menuitem"
                      onClick={async () => {
                        setOpen(null);
                        const go = await confirmDialog('필사그래피 구글 드라이브로 이동됩니다. 이동하시겠습니까?', { confirmText: '이동', cancelText: '취소' });
                        if (go) window.open(it.external, '_blank', 'noopener,noreferrer');
                      }}
                      className="flex h-[46px] w-full items-center px-4 text-left text-[15px] tracking-[-0.02em] text-ink-2 active:bg-surface-2"
                    >
                      {it.name}
                    </button>
                  ) : (
                    <Link
                      href={it.path}
                      role="menuitem"
                      onClick={() => setOpen(null)}
                      className={`flex h-[46px] items-center px-4 text-[15px] tracking-[-0.02em] active:bg-surface-2 ${
                        (it.exact ? pathname === it.path : within(pathname, it.path)) ? 'font-semibold text-ink' : 'text-ink-2'
                      }`}
                    >
                      {it.name}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="relative z-10 flex border-t border-line bg-surface" style={{ height: TAB_BAR_HEIGHT }}>
        {tabs.map((t) => {
          const Icon = t.icon;
          const active = tabActive(t) || open === t.key;
          if (t.items) {
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => setOpen((v) => (v === t.key ? null : t.key))}
                aria-haspopup="menu"
                aria-expanded={open === t.key}
                className={itemClass(active)}
              >
                <Icon size={22} strokeWidth={active ? 2.2 : 1.8} aria-hidden />
                {t.label}
              </button>
            );
          }
          // 선택창이 열린 채로 다른 탭을 누르면 닫히면서 바로 이동 (PM 10/11 "마음 바꿔서 마이페이지 누르면 닫히고 가야지")
          return (
            <Link key={t.key} href={t.href} onClick={() => setOpen(null)} className={itemClass(active)} aria-current={active ? 'page' : undefined}>
              <Icon size={22} strokeWidth={active ? 2.2 : 1.8} aria-hidden />
              {t.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
