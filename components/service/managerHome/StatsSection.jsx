'use client';
import React from 'react';
import StatCard from './StatCard';

// StatCard 4개를 회색 세로 바로 구분하여 나열
const STATS = [
  { value: 3, label: '신규 가입자' },
  { value: 2, label: '처리 대기 신고' },
  { value: 6, label: '신규 작성 게시글' },
  { value: 121, label: '전체 회원 수' },
];

export default function StatsSection() {
  return (
    <div className="flex w-full items-center justify-center py-[10px]">
      {STATS.map((stat, index) => (
        <React.Fragment key={stat.label}>
          <div className="flex flex-1 justify-center">
            <StatCard value={stat.value} label={stat.label} />
          </div>
          {index < STATS.length - 1 && (
            <div className="h-[70px] w-px flex-shrink-0 bg-[#919191]" />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}
