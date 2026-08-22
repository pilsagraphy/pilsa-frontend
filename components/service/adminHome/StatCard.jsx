'use client';
import React from 'react';

function formatStatNumber(value) {
  // 1. 숫자를 3자리 단위 배열로 분할 (예: ['121', '123', '456', '789'])
  const parts = Number(value).toLocaleString("ko-KR").split(",");

  // 그룹이 3개 이하(9자리 이하)일 때는 줄바꿈 없이 한 줄로 표시
  if (parts.length <= 3) {
    return parts.join(",");
  }

  // 2. 짝수 그룹이면 앞 2그룹, 홀수 그룹이면 앞 3그룹씩 배분
  const firstLineCount = parts.length % 2 === 0 ? 2 : 3;

  // 3. 첫 번째 줄과 두 번째 줄 생성
  const firstLine = parts.slice(0, firstLineCount).join(",");
  const secondLine = parts.slice(firstLineCount).join(",");

  // 4. 마지막 줄을 제외하고 첫 번째 줄 끝에 쉼표(,)를 붙인 뒤 줄바꿈(\n)
  return `${firstLine},\n${secondLine}`;
}

// 통계 카드: 진한 숫자 + 그 아래 회색 라벨
export default function StatCard({ value, label }) {
  return (
    <div className="flex flex-col items-center justify-center gap-[6px] text-center w-full min-h-[96px]">
      <span className="font-['Pretendard',sans-serif] font-bold text-[36px] leading-[1.3] tracking-[-0.72px] text-[#212121] whitespace-pre-line break-words">
        {formatStatNumber(value)}
      </span>
      <span className="font-['Pretendard',sans-serif] text-[16px] leading-[1.6] tracking-[-0.32px] text-[#919191]">
        {label}
      </span>
    </div>
  );
}
