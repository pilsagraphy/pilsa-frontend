'use client';

import React, { useEffect } from 'react';
import { CircleUser } from 'lucide-react';

import useMyPageStore from '@/stores/useMyPageStore';

export default function MyPageIntro() {
  // 프로필 이름은 마이페이지 요약(useMyPageStore.summary)에서 가져온다
  const { summary, fetchSummary } = useMyPageStore();

  useEffect(() => {
    fetchSummary(); // 스토어가 중복 호출은 막아준다
  }, [fetchSummary]);

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
