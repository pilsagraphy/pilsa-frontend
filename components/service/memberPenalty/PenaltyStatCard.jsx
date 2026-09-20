'use client';
import React from 'react';

// 통계 카드: 값 + 라벨.
// 폰에서는 2×2 로 칸을 꽉 채우고, 넓은 화면에서는 네 장이 한 줄에 같은 폭으로 선다.
// 고정 폭(146px)이었을 때는 폰의 2열 격자에서 카드가 칸을 못 채워 오른쪽에 빈 공간이 남았다.
// 테두리는 연하게, 바탕은 살짝 회색 — 진한 테두리 네 개가 나란히 서면 표처럼 보여 눈이 피곤하다.
export default function PenaltyStatCard({ value, label }) {
  return (
    <div className="flex min-h-[76px] w-full flex-col items-center justify-center gap-[2px] rounded-[10px] border border-[#E5E5E5] bg-[#FAFAFA] px-[12px] py-[12px] text-center font-['Pretendard',sans-serif] sm:min-h-[87px] sm:gap-[4px]">
      <span className="text-[24px] font-semibold leading-[1.3] tracking-[-0.48px] text-[#212121] sm:text-[28px] sm:font-medium sm:tracking-[-0.56px]">
        {value}
      </span>
      <span className="break-keep text-[12px] font-normal leading-[1.5] tracking-[-0.24px] text-[#757575] sm:text-[14px] sm:tracking-[-0.28px]">
        {label}
      </span>
    </div>
  );
}
