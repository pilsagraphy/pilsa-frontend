'use client';

import React, { useEffect } from 'react';
import { Pencil, MessageSquare, Heart } from 'lucide-react';

import useMyPageStore from '@/stores/useMyPageStore';

// 활동 요약에 쓸 지표 3개. key 는 요약 응답의 필드명과 맞춘다.
const STAT_META = [
  { key: 'postCount', label: '작성글', icon: Pencil },
  { key: 'commentCount', label: '작성한 댓글', icon: MessageSquare },
  { key: 'likedCount', label: '좋아요 누른 글', icon: Heart },
];

export default function MyPageStats() {
  // 상태와 실행 함수는 전부 스토어에서 가져온다 (컴포넌트 안에서 직접 fetch 하지 않는다)
  const { summary, isLoading, error, fetchSummary } = useMyPageStore();

  useEffect(() => {
    fetchSummary(); // 화면이 처음 뜰 때 한 번 요청 (스토어가 중복 호출은 막아준다)
  }, [fetchSummary]);

  // 이 위젯은 레이아웃(3칸)을 유지해야 하므로, 로딩/에러 시 화면을 통째로 바꾸지 않고
  // 숫자 자리에만 '-' 를 보여준다. (데이터가 있으면 실제 숫자, 없는 값은 0)
  const isReady = Boolean(summary) && !isLoading && !error;

  return (
    <div className="flex w-full items-stretch bg-white py-[9px]">
      {STAT_META.map((stat, index) => {
        const Icon = stat.icon;
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
