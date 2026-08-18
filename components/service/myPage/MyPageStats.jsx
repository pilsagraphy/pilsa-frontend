'use client';

import React from 'react';
import { Pencil, MessageSquare, Heart } from 'lucide-react';

// TODO: API 연결 (내 활동 통계)
const stats = [
  { key: 'posts', label: '작성글', count: 24, icon: Pencil },
  { key: 'comments', label: '작성한 댓글', count: 87, icon: MessageSquare },
  { key: 'likes', label: '좋아요 누른 글', count: 16, icon: Heart },
];

export default function MyPageStats() {
  return (
    <div className="flex w-full items-stretch bg-white py-[9px]">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
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
              {stat.count}
            </span>
          </div>
        );
      })}
    </div>
  );
}
