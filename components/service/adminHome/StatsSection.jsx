'use client';
import React from 'react';
import Link from 'next/link';
import StatCard from './StatCard';
import { ROUTES } from '@/constants/routes';

// 통계 응답(newMembers 등) → 카드 4장 순서·라벨 매핑
// href: 카드를 누르면 가는 관리 메뉴 (PM, 2026-09-23)
const STAT_ITEMS = [
  { key: 'newMembers', label: '신규 가입자', href: ROUTES.ADMIN_MEMBER_LIST },
  { key: 'pendingReports', label: '처리 대기 신고', href: ROUTES.ADMIN_REPORTS },
  { key: 'newPosts', label: '신규 작성 게시글', href: ROUTES.ADMIN_POSTS },
  { key: 'totalMembers', label: '전체 회원 수', href: ROUTES.ADMIN_MEMBER_LIST },
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

  const items = STAT_ITEMS.map(({ key, label, href }) => ({ value: stats[key] ?? 0, label, href }));

  return (
    // 폰: 2×2. 네 장을 한 줄에 놓으면 라벨이 글자 단위로 끊긴다. 세로선은 한 줄일 때만 뜻이 있다
    <div className="grid w-full grid-cols-2 gap-y-[4px] py-[4px] sm:flex sm:items-stretch sm:justify-center sm:gap-y-0 sm:py-[10px]">
      {items.map((stat, index) => (
        <React.Fragment key={stat.label}>
          <div
            className={`flex justify-center sm:flex-1 ${
              index % 2 === 0 ? 'border-r border-[#DEDEDE] sm:border-r-0' : ''
            }`}
          >
            <Link
              href={stat.href}
              aria-label={`${stat.label} 관리로 이동`}
              className="flex w-full justify-center rounded-[6px] transition hover:bg-[#F6F6F6]"
            >
              <StatCard value={stat.value} label={stat.label} />
            </Link>
          </div>
          {index < items.length - 1 && (
            <div className="hidden w-px flex-shrink-0 self-stretch bg-[#919191] sm:block" />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}
