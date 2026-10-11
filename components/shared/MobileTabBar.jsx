'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CalendarDays, FileText, Home, Images, LayoutDashboard, LogIn, Menu, NotebookPen, Users } from 'lucide-react';
import useSidebarStore from '@/stores/sidebar';
import useAuthStore from '@/stores/useAuthStore';
import { ROUTES } from '@/constants/routes';

// 폰 하단 탭 바 (PM 2026-10-11 "여타 앱처럼 메뉴바가 아래에") — 768px(tablet) 미만에서만 보인다.
// 자주 가는 네 곳 + '메뉴'(기존 사이드바 드로어를 연다). 사이드바의 모든 항목은 '메뉴'로 그대로 닿는다.
//  - 회원·공개 영역: 홈(메인 페이지) · 일정 · 사진 · 방명록. 비로그인이면 홈 대신 로그인
//  - 관리자 영역(/admin 하위): 관리자홈 · 회원 · 게시글 · 일정
// 드로어(z-60)와 그 어둡게(z-50)보다 아래(z-40)라 메뉴가 열리면 가려진다. 바 높이만큼은 layout 이 푸터 아래 여백으로 비워 둔다.
export const TAB_BAR_HEIGHT = 56;

const MEMBER_TABS = (isLoggedIn) => [
  isLoggedIn
    ? { key: 'home', label: '홈', href: ROUTES.STUDENTS_DASHBOARD, icon: Home, exact: true }
    : { key: 'login', label: '로그인', href: ROUTES.LOGIN, icon: LogIn },
  { key: 'calendar', label: '일정', href: ROUTES.CALENDAR, icon: CalendarDays },
  { key: 'gallery', label: '사진', href: ROUTES.GALLERY, icon: Images },
  { key: 'guestbook', label: '방명록', href: ROUTES.GUESTBOOK, icon: NotebookPen },
];

const ADMIN_TABS = [
  { key: 'admin', label: '관리자홈', href: ROUTES.ADMIN_HOME, icon: LayoutDashboard, exact: true },
  { key: 'members', label: '회원', href: ROUTES.ADMIN_MEMBER_LIST, icon: Users },
  { key: 'posts', label: '게시글', href: ROUTES.ADMIN_POSTS, icon: FileText },
  { key: 'calendar', label: '일정', href: ROUTES.ADMIN_CALENDAR, icon: CalendarDays },
];

export default function MobileTabBar() {
  const pathname = usePathname();
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);
  const openMobile = useSidebarStore((s) => s.openMobile);
  const tabs = pathname.startsWith(ROUTES.ADMIN_HOME) ? ADMIN_TABS : MEMBER_TABS(isLoggedIn);

  // 하위 경로(게시판 글 상세 등)도 그 탭이 켜진 것으로 본다. exact 인 홈은 정확히 일치할 때만
  const isActive = (t) => (t.exact ? pathname === t.href : pathname === t.href || pathname.startsWith(`${t.href}/`));
  const itemClass = (active) =>
    `flex h-full min-w-0 flex-1 flex-col items-center justify-center gap-[3px] text-[11px] tracking-[-0.02em] transition-colors ${
      active ? 'font-semibold text-ink' : 'text-ink-3 active:text-ink'
    }`;

  return (
    <nav
      aria-label="하단 메뉴"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface tablet:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="flex" style={{ height: TAB_BAR_HEIGHT }}>
        {tabs.map((t) => {
          const Icon = t.icon;
          const active = isActive(t);
          return (
            <Link key={t.key} href={t.href} className={itemClass(active)} aria-current={active ? 'page' : undefined}>
              <Icon size={22} strokeWidth={active ? 2.2 : 1.8} aria-hidden />
              {t.label}
            </Link>
          );
        })}
        <button type="button" onClick={openMobile} className={itemClass(false)} aria-label="전체 메뉴 열기">
          <Menu size={22} strokeWidth={1.8} aria-hidden />
          메뉴
        </button>
      </div>
    </nav>
  );
}
