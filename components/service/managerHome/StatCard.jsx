'use client';
import React from 'react';

// 통계 카드: 진한 숫자 + 그 아래 회색 라벨
export default function StatCard({ value, label }) {
  return (
    <div className="flex flex-col items-center justify-center gap-[6px] text-center">
      <span className="font-['Pretendard',sans-serif] font-bold text-[36px] leading-[1.6] tracking-[-0.72px] text-[#212121]">
        {value}
      </span>
      <span className="font-['Pretendard',sans-serif] text-[16px] leading-[1.6] tracking-[-0.32px] text-[#919191]">
        {label}
      </span>
    </div>
  );
}
