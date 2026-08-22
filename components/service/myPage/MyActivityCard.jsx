'use client';

import React from 'react';
import { Info } from 'lucide-react';

// TODO: API 연결 (이번 학기 활동 요약)
const summary = [
  { key: 'posts', label: '작성한 글', value: '0개' },
  { key: 'comments', label: '작성한 댓글', value: '0개' },
  { key: 'likes', label: '받은 좋아요', value: '0개' },
];

export default function MyActivityCard() {
  return (
    <div className="w-full rounded-[10px] border border-black/20 bg-white px-[17px] py-[16px] lg:flex-1">
      <div className="flex items-center gap-[8px]">
        <h3 className="text-[16px] font-bold leading-[1.5] tracking-[-0.02em] text-black">
          이번 학기 활동 요약
        </h3>
        <Info size={16} className="text-[#B9B9B9]" strokeWidth={1.5} />
      </div>

      {/* 선을 '작성한 글' 바로 위(목록 상단)에 붙임 */}
      <dl className="-mx-[12px] mt-[40px] flex flex-col border-t border-[#BDBDBD] px-[12px]">
        {summary.map((item, index) => (
          <div
            key={item.key}
            className={`-mx-[12px] flex items-center justify-between px-[12px] py-[14px] ${
              index !== summary.length - 1 ? 'border-b border-[#BDBDBD]' : ''
            }`}
          >
            <dt className="text-[13px] leading-[1.6] tracking-[-0.02em] text-[#454545]">
              {item.label}
            </dt>
            <dd className="text-[13px] leading-[1.6] tracking-[-0.02em] text-black">
              {item.value}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
