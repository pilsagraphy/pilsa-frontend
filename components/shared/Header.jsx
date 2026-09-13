'use client';

import { Menu } from 'lucide-react';
import Link from 'next/link';
import { ROUTES } from '@/constants/routes';
import { Zen_Dots } from 'next/font/google';
import useAuthStore from '@/stores/useAuthStore';

const zenDots = Zen_Dots({
  weight: '400',
  subsets: ['latin'],
});

export default function Header() {
  // 로그인한 사람에게 '홈'은 학생 대시보드다 — 소개 페이지로 보내면 로그인하고도 계속 손님 화면에 떨어진다.
  // 비로그인은 그대로 소개 페이지(첫 실행이면 middleware 가 시계 게이트로 돌려보낸다)
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);
  const homeHref = isLoggedIn ? ROUTES.STUDENTS_DASHBOARD : ROUTES.ABOUT_INTRO;

  return (
    <header className="w-full h-40">
      <div
        className="
          grid h-full items-center
          px-[5px]  /* 양옆 최소 간격 5px 유지 */
          lg:px-24
        "
      >
        {/* 중앙 로고: clamp를 사용하여 유동적인 폰트 크기 적용 */}
        <h1
          className={`${zenDots.className} text-center whitespace-nowrap`}
          style={{
            /* clamp(최소값, 가변값, 최대값)
               - 최소: 24px (모바일 최저치)
               - 가변: 9vw (화면 너비의 9%에 맞춰 변화)
               - 최대: 48px
            */
            fontSize: 'clamp(24px, 9vw, 48px)',
          }}
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
      </div>
    </header>
  );
}
