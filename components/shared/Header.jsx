'use client';

import { Menu, UserRound } from 'lucide-react';
import Link from 'next/link';
import { ROUTES } from '@/constants/routes';
import { Zen_Dots } from 'next/font/google';
import useAuthStore from '@/stores/useAuthStore';
import useSidebarStore from '@/stores/sidebar';
import NotificationBell from '@/components/service/notification/NotificationBell';
import { loginUrlWithReturnTo, currentPathForReturn } from '@/lib/returnTo';

const zenDots = Zen_Dots({
  weight: '400',
  subsets: ['latin'],
});

// 상단 헤더. 폰: 햄버거 · 로고 · 알림 종 + 프로필. PC: 사이드바가 항상 펼쳐져 있어 햄버거만 빠진다.
// 알림함(NotificationBell)은 만들어져 있었는데 어디에도 붙어 있지 않았다(2026-09-20) — 여기가 제자리다.
export default function Header() {
  // 로그인한 사람에게 '홈'은 학생 대시보드다 — 소개 페이지로 보내면 로그인하고도 계속 손님 화면에 떨어진다.
  // 비로그인은 그대로 소개 페이지(첫 실행이면 middleware 가 시계 게이트로 돌려보낸다)
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);
  const homeHref = isLoggedIn ? ROUTES.STUDENTS_DASHBOARD : ROUTES.ABOUT_INTRO;
  const openMobile = useSidebarStore((s) => s.openMobile);

  const iconButton =
    'grid size-10 place-items-center rounded-full text-[#212121] transition hover:bg-[#F5F5F5]';

  return (
    <header className="w-full h-16 tablet:h-40">
      <div className="flex h-full items-center px-3 tablet:grid tablet:grid-cols-[auto_1fr_auto] tablet:px-6 lg:px-24">
        {/* 왼쪽: 폰에서만 사이드바 여는 버튼. PC 는 사이드바가 늘 보여서 자리만 남긴다.
            태블릿 이상에서만 좌우 칸 폭을 같게 둔다 — 그래야 가운데 로고가 화면 정중앙에 선다 */}
        <div className="flex shrink-0 items-center tablet:w-24">
          <button
            type="button"
            aria-label="메뉴 열기"
            onClick={openMobile}
            className={`${iconButton} tablet:hidden`}
          >
            <Menu size={24} />
          </button>
        </div>

        {/* 가운데 로고. clamp 로 폰에서는 작게, PC 에서는 크게 */}
        {/* 폰에서는 로고를 왼쪽(햄버거 옆)에 붙인다. 가운데에 두면 글자가 오른쪽 알림 종까지 닿는다.
            태블릿부터는 화면이 넓어 가운데 정렬로 돌아간다.
            크기는 남는 폭에 맞춰 줄어든다 — (100vw - 200px) 는 좌우 아이콘 칸과 바깥 여백을 뺀 폭이고,
            8.6 은 이 글꼴에서 'PILSAGRAPHY' 11글자가 글자 크기의 몇 배를 차지하는지다. */}
        <h1
          className={`${zenDots.className} min-w-0 flex-1 overflow-hidden whitespace-nowrap pl-1 text-left tablet:pl-0 tablet:text-center`}
          style={{ fontSize: 'clamp(15px, min(6.5vw, (100vw - 200px) / 8.6), 48px)' }}
        >
          {/* 시계 게이트(/)로는 보내지 않는다 — 로그인 상태면 학생 홈, 아니면 소개 페이지 */}
          <Link
            href={homeHref}
            aria-label={isLoggedIn ? '홈으로 이동' : '필사그래피 소개로 이동'}
            className="inline-block"
          >
            PILSAGRAPHY
          </Link>
        </h1>

        {/* 오른쪽: 알림 종(로그인 시에만 그려진다) + 프로필. 왼쪽과 폭을 맞춰 로고가 정중앙에 선다 */}
        <div className="flex shrink-0 items-center justify-end tablet:w-24 tablet:gap-1">
          <NotificationBell />
          <Link
            href={isLoggedIn ? ROUTES.MY_PAGE : loginUrlWithReturnTo(currentPathForReturn())}
            aria-label={isLoggedIn ? '마이페이지' : '로그인'}
            className={iconButton}
          >
            <UserRound size={22} />
          </Link>
        </div>
      </div>
    </header>
  );
}
