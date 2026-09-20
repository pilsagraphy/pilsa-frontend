'use client';

import React, { useEffect, useState } from 'react';
import { CircleUser } from 'lucide-react';

import useMyPageStore from '@/stores/useMyPageStore';
import { getCurrentQuote } from '@/apis/quote';

export default function MyPageIntro() {
  // 프로필 이름은 스토어에서 읽기만 한다 (호출은 MyPageSection이 담당)
  const summary = useMyPageStore((s) => s.summary);

  const userName = summary?.name || '회원'; // 불러오기 전에는 '회원'

  // 이 주의 문장. 오늘을 포함하는 문장이 없으면 null 이고, 그때는 줄 자체를 그리지 않는다
  const [quote, setQuote] = useState(null);
  useEffect(() => {
    let alive = true;
    getCurrentQuote().then((content) => {
      if (alive) setQuote(content);
    });
    return () => {
      alive = false;
    };
  }, []);

  return (
    <div className="flex w-full items-center gap-[16px]">
      {/* 사용자 프로필 아이콘 */}
      <CircleUser className="h-[64px] w-[64px] shrink-0 text-[#212121]" strokeWidth={1.5} />

      <div className="flex min-w-0 flex-col gap-[4px]">
        <h2 className="text-[18px] font-bold leading-[1.5] tracking-[-0.02em] text-black md:text-[20px]">
          {userName}님, 안녕하세요! :) ✍️
        </h2>
        <p className="text-[14px] font-normal leading-[1.6] tracking-[-0.02em] text-[#212121] md:text-[15px]">
          {quote ? '오늘도 이 주의 문장과 함께 좋은 하루 보내세요' : '오늘도 좋은 하루 보내세요 !'}
        </p>
        {quote && (
          <p className="break-words text-[13px] leading-[1.6] tracking-[-0.02em] text-[#B9B9B9] md:text-[14px]">
            &quot;{quote}&quot;
          </p>
        )}
      </div>
    </div>
  );
}
