'use client';
import React from 'react';
import StatsSection from './StatsSection';
import Schedule from './Schedule';
import RecentActivitySection from './RecentActivitySection';

// 합치는 곳: 관리자 홈 화면
export default function ManagerDashboardSection() {
  return (
    <section className="mx-auto flex w-full max-w-[1016px] flex-col bg-white p-8 gap-[30px]">
      {/* 영역 1: 인사말 */}
      <div className="flex w-full flex-col">
        <div className="flex flex-col gap-[12px] pb-[24px]">
          <h2 className="font-['Pretendard',sans-serif] text-[24px] font-semibold leading-[1.5] tracking-[-0.48px] text-[#212121]">
            운영진님, 안녕하세요 :)
          </h2>
          <p className="font-['Pretendard',sans-serif] text-[16px] font-normal leading-[1.6] tracking-[-0.32px] text-[#919191]">
            오늘도 큰 사고 없이 무탈한 하루 되세요!
          </p>
        </div>
        <div className="w-full border-b border-[#DEDEDE]" />
      </div>

      {/* 영역 2: 통계 카드 */}
      <StatsSection />

      {/* 영역 3: 일정 달력 */}
      <Schedule />

      {/* 영역 4: 최근 신고 / 최근 가입 회원 */}
      <RecentActivitySection />
    </section>
  );
}
