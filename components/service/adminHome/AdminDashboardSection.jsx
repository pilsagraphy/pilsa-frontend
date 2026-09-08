'use client';
import React, { useEffect } from 'react';
import StatsSection from './StatsSection';
import Schedule from './Schedule';
import RecentActivitySection from './RecentActivitySection';
import useAdminDashboardStore from '@/stores/useAdminDashboardStore';

// 합치는 곳: 관리자 홈 화면
// 스토어에서 통계 · 최근 신고 · 최근 가입 세 영역을 받아 각 하위 섹션에 내려준다.
export default function ManagerDashboardSection() {
  const stats = useAdminDashboardStore((state) => state.stats);
  const isStatsLoading = useAdminDashboardStore((state) => state.isStatsLoading);
  const statsError = useAdminDashboardStore((state) => state.statsError);

  const recentReports = useAdminDashboardStore((state) => state.recentReports);
  const isReportsLoading = useAdminDashboardStore((state) => state.isReportsLoading);
  const reportsError = useAdminDashboardStore((state) => state.reportsError);

  const recentMembers = useAdminDashboardStore((state) => state.recentMembers);
  const isMembersLoading = useAdminDashboardStore((state) => state.isMembersLoading);
  const membersError = useAdminDashboardStore((state) => state.membersError);

  const fetchStats = useAdminDashboardStore((state) => state.fetchStats);
  const fetchRecentReports = useAdminDashboardStore((state) => state.fetchRecentReports);
  const fetchRecentMembers = useAdminDashboardStore((state) => state.fetchRecentMembers);
  const reset = useAdminDashboardStore((state) => state.reset);

  // 화면 진입 시 세 영역을 각각 불러오고, 떠날 때 이전 결과를 비운다.
  useEffect(() => {
    fetchStats();
    fetchRecentReports();
    fetchRecentMembers();
    return () => reset();
  }, [fetchStats, fetchRecentReports, fetchRecentMembers, reset]);

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
      <StatsSection stats={stats} isLoading={isStatsLoading} error={statsError} />

      {/* 영역 3: 일정 달력 */}
      <Schedule />

      {/* 영역 4: 최근 신고 / 최근 가입 회원 */}
      <RecentActivitySection
        reports={recentReports}
        isReportsLoading={isReportsLoading}
        reportsError={reportsError}
        members={recentMembers}
        isMembersLoading={isMembersLoading}
        membersError={membersError}
      />
    </section>
  );
}
