'use client';
import React from 'react';
import StatCard from './StatCard';

// 통계 응답(newMembers 등) → 카드 4장 순서·라벨 매핑
const STAT_ITEMS = [
  { key: 'newMembers', label: '신규 가입자' },
  { key: 'pendingReports', label: '처리 대기 신고' },
  { key: 'newPosts', label: '신규 작성 게시글' },
  { key: 'totalMembers', label: '전체 회원 수' },
];

// 카드 자리에 들어가는 상태 문구 (로딩/에러/데이터 없음)
function StatsMessage({ children }) {
  return (
    <div className="flex w-full items-center justify-center py-[10px]">
      <span className="font-['Pretendard',sans-serif] text-[16px] leading-[1.6] tracking-[-0.32px] text-[#919191]">
        {children}
      </span>
    </div>
  );
}

// StatCard 목록을 회색 세로 바로 구분하여 나열
export default function StatsSection({ stats, isLoading, error }) {
  if (isLoading) return <StatsMessage>불러오는 중...</StatsMessage>;
  if (error) return <StatsMessage>{error}</StatsMessage>;
  if (!stats) return <StatsMessage>표시할 통계가 없습니다.</StatsMessage>;

  const items = STAT_ITEMS.map(({ key, label }) => ({ value: stats[key] ?? 0, label }));

  return (
    <div className="flex w-full items-stretch justify-center py-[10px]">
      {items.map((stat, index) => (
        <React.Fragment key={stat.label}>
          <div className="flex flex-1 justify-center">
            <StatCard value={stat.value} label={stat.label} />
          </div>
          {index < items.length - 1 && (
            <div className="w-px flex-shrink-0 self-stretch bg-[#919191]" />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}
