'use client';
import React from 'react';

// 통계 카드: 둥근 모서리 + 얇은 테두리 사각형
// 큰 값(중간 굵기) + 그 아래 작은 라벨
export default function PenaltyStatCard({ value, label }) {
  return (
    <div className="flex h-[87px] w-[146px] flex-col justify-center gap-[6px] rounded-[12px] border border-[#919191] px-[21px] font-['Pretendard',sans-serif]">
      <span className="text-[28px] font-medium leading-[1.5] tracking-[-0.56px] text-[#212121]">
        {value}
      </span>
      <span className="text-[14px] font-normal leading-[1.5] tracking-[-0.28px] text-[#212121]">
        {label}
      </span>
    </div>
  );
}
