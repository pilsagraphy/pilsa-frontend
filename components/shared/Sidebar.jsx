// components/shared/Sidebar.jsx
'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronDown } from 'lucide-react';
import useSidebarStore from '@/stores/sidebar';
import { ROUTES } from '@/constants/routes';

const Sidebar = () => {
  const { openMenus, toggleMenu, toggleLogin, isLoggedIn } = useSidebarStore();
  const pathname = usePathname();

  // [수정] 메뉴 데이터 구조 재구성
  const menuConfig = {
    about: {
      title: 'ABOUT PILSA',
      path: ROUTES.ABOUT,
      subMenus: [
        { name: '동아리 소개', path: ROUTES.ABOUT_INTRO },
        { name: '연혁', path: ROUTES.ABOUT_HISTORY },
        { name: '브랜드CI', path: ROUTES.ABOUT_LOGO },
        { name: '명예의 전당', path: ROUTES.ABOUT_HONOR },
        { name: '역대회장', path: ROUTES.ABOUT_LEADER },
      ],
    },
    board: {
      title: '게시판',
      path: ROUTES.STUDENTS_DASHBOARD,
      subMenus: [
        { name: '메인페이지', path: ROUTES.STUDENTS_DASHBOARD },
        { name: '공지사항', path: ROUTES.NOTICES },
        { name: '자유게시판', path: '/board/free' }, // 임시 경로
        { name: '정보게시판', path: '/board/info' }, // 임시 경로
      ],
    },
  };

  // 활성화 상태 체크 (상위 경로 포함)
  const isAboutActive = pathname.startsWith(ROUTES.ABOUT);
  const isBoardActive = pathname.startsWith(ROUTES.STUDENTS_DASHBOARD);

  const loginText = isLoggedIn ? '로그아웃' : '로그인';
  const loginPath = isLoggedIn ? ROUTES.LOGOUT : ROUTES.LOGIN;

  return (
    <div className="w-[240px] h-full bg-white flex flex-col pr-[40px] py-10 font-['Pretendard']">
      <div className="flex flex-col gap-6 w-full items-end">
        {/* 1. ABOUT PILSA (드롭다운) */}
        <div className="w-full flex flex-col items-end">
          <button
            onClick={() => toggleMenu('about')}
            className={`flex items-center gap-1 py-2 text-[16px] ${isAboutActive ? 'font-bold text-[#212121]' : 'font-medium text-[#919191]'}`}
          >
            ABOUT PILSA
            <ArrowIcon isOpen={openMenus.about} />
          </button>

          {openMenus.about && (
            <div className="flex flex-col items-end gap-2 mt-2">
              {menuConfig.about.subMenus.map((menu) => (
                <Link key={menu.name} href={menu.path}>
                  <p
                    className={`text-[14px] cursor-pointer ${pathname === menu.path ? 'font-bold text-[#212121]' : 'text-[#919191] hover:text-[#212121]'}`}
                  >
                    {menu.name}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* 2. 게시판 (드롭다운) */}
        <div className="w-full flex flex-col items-end">
          <button
            onClick={() => toggleMenu('board')}
            className={`flex items-center gap-1 py-2 text-[16px] ${isBoardActive ? 'font-bold text-[#212121]' : 'font-medium text-[#919191]'}`}
          >
            게시판
            <ArrowIcon isOpen={openMenus.board} />
          </button>

          {openMenus.board && (
            <div className="flex flex-col items-end gap-2 mt-2">
              {menuConfig.board.subMenus.map((menu) => (
                <Link key={menu.name} href={menu.path}>
                  <p
                    className={`text-[14px] cursor-pointer ${pathname === menu.path ? 'font-bold text-[#212121]' : 'text-[#919191] hover:text-[#212121]'}`}
                  >
                    {menu.name}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* 3. 기타 단일 메뉴들 (일정 달력 추가 및 위치 수정) */}
        <Link href="/calendar">
          <p
            className={`text-[16px] font-bold ${pathname === '/calendar' ? 'text-[#212121]' : 'text-[#919191] hover:text-[#212121]'}`}
          >
            일정 달력
          </p>
        </Link>
        <Link href={ROUTES.GALLERY}>
          <p
            className={`text-[16px] font-bold ${pathname === ROUTES.GALLERY ? 'text-[#212121]' : 'text-[#919191] hover:text-[#212121]'}`}
          >
            활동 사진들
          </p>
        </Link>
        <Link href="/guestbook">
          <p
            className={`text-[16px] font-bold ${pathname === '/guestbook' ? 'text-[#212121]' : 'text-[#919191] hover:text-[#212121]'}`}
          >
            방명록
          </p>
        </Link>
      </div>

      {/* 4. 로그인/로그아웃 영역 */}
      <div className="mt-[60px] flex flex-col items-end">
        <Link href={loginPath}>
          <button
            onClick={toggleLogin}
            className="text-[16px] font-bold text-[#212121] hover:underline"
          >
            {loginText}
          </button>
        </Link>
      </div>
    </div>
  );
};

const ArrowIcon = ({ isOpen }) => (
  <ChevronDown
    size={16}
    strokeWidth={2.5}
    className={`transition-transform duration-200 text-[#B9B9B9] ${isOpen ? 'rotate-180' : 'rotate-0'}`}
  />
);

export default Sidebar;
