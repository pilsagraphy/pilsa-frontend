'use client';

import React, { useEffect } from 'react';
import { Info } from 'lucide-react';

import useMyPageStore from '@/stores/useMyPageStore';

// 이번 학기 활동. key 는 요약 응답의 semester 필드명과 맞춘다.
const ACTIVITY_META = [
  { key: 'posts', label: '작성한 글' },
  { key: 'comments', label: '작성한 댓글' },
  { key: 'receivedLikes', label: '받은 좋아요' },
];

export default function MyActivityCard() {
  const { summary, fetchSummary } = useMyPageStore();

  useEffect(() => {
    fetchSummary(); // 스토어가 중복 호출은 막아준다
  }, [fetchSummary]);

  const semester = summary?.semester ?? null; // 불러오기 전에는 null

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
        {ACTIVITY_META.map((item, index) => (
          <div
            key={item.key}
            className={`-mx-[12px] flex items-center justify-between px-[12px] py-[14px] ${
              index !== ACTIVITY_META.length - 1 ? 'border-b border-[#BDBDBD]' : ''
            }`}
          >
            <dt className="text-[13px] leading-[1.6] tracking-[-0.02em] text-[#454545]">
              {item.label}
            </dt>
            <dd className="text-[13px] leading-[1.6] tracking-[-0.02em] text-black">
              {semester ? `${semester[item.key] ?? 0}개` : '-'}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
