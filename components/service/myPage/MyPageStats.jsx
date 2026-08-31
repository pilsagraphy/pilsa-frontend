'use client';

import React from 'react';
import { Pencil, MessageSquare, Heart } from 'lucide-react';

import useMyPageStore from '@/stores/useMyPageStore';

// 활동 요약에 쓸 지표 3개. key 는 요약 응답의 필드명과 맞춘다.
const STAT_META = [
  { key: 'postCount', label: '작성글', icon: Pencil },
  { key: 'commentCount', label: '작성한 댓글', icon: MessageSquare },
  { key: 'likedCount', label: '좋아요 누른 글', icon: Heart },
];

export default function MyPageStats() {
  // 데이터는 스토어에서 읽기만 한다 (호출은 MyPageSection이 담당)
  const summary = useMyPageStore((s) => s.summary);
  const isLoading = useMyPageStore((s) => s.isLoading);
  const error = useMyPageStore((s) => s.error);

  // 실패 시: 최소한 이유를 보여준다 (숫자 자리에 '-' 만 남기지 않도록)
  if (error) {
    return (
      <div className="flex w-full items-center justify-center bg-white py-[20px] text-[13px] text-[#919191]">
        {error}
      </div>
    );
  }

  const isReady = Boolean(summary) && !isLoading;

  return (
    <div className="flex w-full items-stretch bg-white py-[9px]">
      {STAT_META.map((stat, index) => {
        const Icon = stat.icon;
        // 아직 안 불러왔으면 '-', 불러왔으면 해당 숫자(없으면 0)
        const count = isReady ? (summary[stat.key] ?? 0) : null;
        return (
          <div
            key={stat.key}
            className={`flex flex-1 flex-col items-center justify-center gap-[8px] px-2 py-[6px] ${
              index !== 0 ? 'border-l border-[#B9B9B9]' : ''
            }`}
          >
            <div className="flex items-center gap-[8px]">
              <Icon size={16} className="text-[#212121]" strokeWidth={2} />
              <span className="text-[13px] font-semibold leading-[1.6] tracking-[-0.02em] text-[#212121] md:text-[14px]">
                {stat.label}
              </span>
            </div>
            <span className="text-[22px] font-bold leading-[1.5] tracking-[-0.02em] text-[#212121] md:text-[24px]">
              {count === null ? '-' : count}
            </span>
          </div>
        );
      })}
    </div>
  );
}
