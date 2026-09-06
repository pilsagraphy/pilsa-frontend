'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { useMinWidthMd } from '@/lib/useMinWidthMd';

// 상세 상단: 게시판 제목 + (데스크톱 전용) 목록 버튼
export default function BoardHead({ label, listPath }) {
  const router = useRouter();
  const isMdUp = useMinWidthMd();

  // 모바일(#183): 제목 24px + '목록으로 돌아가기' 텍스트 링크. 데스크톱은 아래 return 그대로.
  if (!isMdUp) {
    return (
      <div className="flex w-full flex-col gap-[10px]">
        <h1 className="text-[24px] font-bold leading-[29px] text-[#454545]">{label}</h1>
        <button
          type="button"
          onClick={() => router.push(listPath)}
          className="flex items-center gap-[2px] text-[#919191]"
        >
          <ChevronLeft size={20} strokeWidth={1.5} className="text-[#B9B9B9]" aria-hidden />
          <span className="text-[12px] leading-[14px]">목록으로 돌아가기</span>
        </button>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col gap-4 md:flex-row md:items-start md:justify-between">
      <h1 className="text-[20px] font-semibold tracking-[-0.48px] text-[#212121] md:mt-[36px] md:text-[24px]">
        {label}
      </h1>

      <button
        type="button"
        className="hidden h-[52px] w-[135px] shrink-0 items-center justify-center rounded-[4px] bg-[#212121] text-white md:flex md:self-start md:translate-y-[60px]"
        onClick={() => router.push(listPath)}
      >
        목록
      </button>
    </div>
  );
}
