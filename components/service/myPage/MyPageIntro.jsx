'use client';

import React from 'react';
import { CircleUser } from 'lucide-react';

import useMyPageStore from '@/stores/useMyPageStore';

export default function MyPageIntro() {
  // 프로필 이름은 스토어에서 읽기만 한다 (호출은 MyPageSection이 담당)
  const summary = useMyPageStore((s) => s.summary);

  const userName = summary?.name || '회원'; // 불러오기 전에는 '회원'

  return (
    <div className="flex w-full items-center gap-[16px]">
      {/* 사용자 프로필 아이콘 */}
      <CircleUser className="h-[64px] w-[64px] shrink-0 text-[#212121]" strokeWidth={1.5} />

      <div className="flex min-w-0 flex-col gap-[7px]">
        <h2 className="font-['Pretendard',sans-serif] text-[22px] font-bold leading-[1.5] tracking-[-0.02em] text-black md:text-[24px]">
          {userName}님, 안녕하세요! :) ✍️
        </h2>
        <p className="font-['Pretendard',sans-serif] text-[18px] font-normal leading-[1.6] tracking-[-0.02em] text-[#212121] md:text-[20px]">
          오늘도 좋은하루 보내세요 !
        </p>
      </div>
    </div>
  );
}
