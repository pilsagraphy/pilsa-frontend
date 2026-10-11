'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BookOpenText, CalendarDays, FileText, Home, LayoutDashboard, LayoutList, LogIn, Menu, Sparkles, UserRound, Users } from 'lucide-react';
import useSidebarStore from '@/stores/sidebar';
import useAuthStore from '@/stores/useAuthStore';
import useBoardStore from '@/stores/useBoardStore';
import { ROUTES } from '@/constants/routes';

// 폰 하단 탭 바 (PM 2026-10-11 "여타 앱처럼 메뉴바가 아래에") — 768px(tablet) 미만에서만 보인다.
// 구성은 PM 지정: 홈 · 게시판 · 활동(일정/사진/방명록) · ABOUT(소개/연혁/브랜드CI/명예의 전당/역대회장) · 마이페이지(비로그인은 로그인).
// 게시판·활동·ABOUT 은 누르면 바 바로 위에 선택창이 뜬다 — 같은 탭을 다시 누르거나 바깥을 누르면 닫히고, 이동하면 닫힌다.
// 게시판 목록은 사이드바처럼 GET /api/user/boards(useBoardStore)로 그린다(하드코딩 금지). 전체 메뉴(드로어)는 헤더의 햄버거가 그대로 연다.
// 관리자 영역(/admin 하위): 관리자홈 · 회원 · 게시글 · 일정 · 메뉴(드로어).
// 드로어(z-60)와 그 어둡게(z-50)보다 아래(z-40)라 드로어가 열리면 가려진다. 바 높이만큼은 layout 이 푸터 아래 여백으로 비워 둔다.
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
const ADMIN_TABS = [
  { key: 'admin', label: '관리자홈', href: ROUTES.ADMIN_HOME, icon: LayoutDashboard, exact: true },
  { key: 'members', label: '회원', href: ROUTES.ADMIN_MEMBER_LIST, icon: Users },
  { key: 'posts', label: '게시글', href: ROUTES.ADMIN_POSTS, icon: FileText },
  { key: 'calendar', label: '일정', href: ROUTES.ADMIN_CALENDAR, icon: CalendarDays },
  { key: 'drawer', label: '메뉴', icon: Menu, drawer: true },
];

// 하위 경로(게시판 글 상세 등)도 그 항목이 켜진 것으로 본다
const within = (pathname, path) => pathname === path || pathname.startsWith(`${path}/`);

export default function MobileTabBar() {
  const pathname = usePathname();
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);
  const openMobile = useSidebarStore((s) => s.openMobile);
  const boards = useBoardStore((s) => s.data);
  const ensureBoards = useBoardStore((s) => s.ensureBoards);
  const [open, setOpen] = useState(null); // 열린 선택창의 탭 key

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
  const tabs = isAdminArea
    ? ADMIN_TABS
    : [
        { key: 'home', label: '홈', href: ROUTES.STUDENTS_DASHBOARD, icon: Home, exact: true },
        { key: 'boards', label: '게시판', icon: LayoutList, title: '회원 게시판', items: boardItems, emptyText: '게시판 목록을 불러오는 중이에요.' },
        { key: 'activity', label: '활동', icon: Sparkles, title: '일정 · 사진 · 방명록', items: ACTIVITY_ITEMS },
        { key: 'about', label: 'ABOUT', icon: BookOpenText, title: 'ABOUT PILSA', items: ABOUT_ITEMS },
        isLoggedIn
          ? { key: 'mypage', label: '마이페이지', href: ROUTES.MY_PAGE, icon: UserRound }
          : { key: 'login', label: '로그인', href: ROUTES.LOGIN, icon: LogIn },
      ];

  const tabActive = (t) => {
    if (t.items) return t.items.some((it) => within(pathname, it.path));
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
        <>
          <div
            role="menu"
            aria-label={openTab.title}
            className="absolute inset-x-3 bottom-[calc(100%_+_10px)] z-10 overflow-hidden rounded-[14px] border border-line bg-elevated shadow-[0_8px_30px_rgba(0,0,0,0.18)]"
          >
            <p className="px-4 pb-1 pt-3 text-[11px] font-semibold tracking-[-0.02em] text-ink-3">{openTab.title}</p>
            {openTab.items.length === 0 ? (
              <p className="px-4 pb-4 pt-1 text-[13px] text-ink-3">{openTab.emptyText}</p>
            ) : (
              <ul className="pb-2">
                {openTab.items.map((it) => (
                  <li key={it.path}>
                    <Link
                      href={it.path}
                      role="menuitem"
                      onClick={() => setOpen(null)}
                      className={`flex h-[46px] items-center px-4 text-[15px] tracking-[-0.02em] active:bg-surface-2 ${
                        within(pathname, it.path) ? 'font-semibold text-ink' : 'text-ink-2'
                      }`}
                    >
                      {it.name}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
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
          if (t.drawer) {
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => {
                  setOpen(null);
                  openMobile();
                }}
                aria-label="전체 메뉴 열기"
                className={itemClass(false)}
              >
                <Icon size={22} strokeWidth={1.8} aria-hidden />
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
