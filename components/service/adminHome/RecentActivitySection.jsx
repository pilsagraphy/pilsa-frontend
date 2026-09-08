'use client';
import React from 'react';
import { ArrowRight } from 'lucide-react';
import { formatDotDate } from '@/lib/utils';

// 회원 신분 코드 → 화면 라벨 (회원가입 화면과 동일 규칙)
const MEMBER_TYPE_LABELS = { STUDENT: '재학생', ALUMNI: '졸업생' };

// 섹션 헤더: 제목 + 전체보기 →
function ActivityHeader({ title }) {
  return (
    <div className="flex h-[44px] items-center justify-between">
      <h3 className="text-[20px] font-semibold leading-[1.5] tracking-[-0.4px] text-[#212121]">
        {title}
      </h3>
      <div className="flex cursor-pointer items-center gap-[6px] text-[#B9B9B9] transition hover:text-[#919191]">
        <span className="text-[16px] leading-[1.6] tracking-[-0.32px]">전체보기</span>
        <ArrowRight size={16} strokeWidth={2} />
      </div>
    </div>
  );
}

// 목록 자리 상태 문구 (로딩/에러/데이터 없음) — 한 행 높이를 유지해 테두리가 무너지지 않게 한다
function ActivityMessage({ children }) {
  return (
    <div className="flex h-[44px] items-center justify-center border-b border-[#B9B9B9] text-[16px] leading-[1.6] tracking-[-0.32px] text-[#919191]">
      {children}
    </div>
  );
}

// 최근 신고 목록
function RecentReports({ reports, isLoading, error }) {
  return (
    <div className="flex w-full flex-col lg:flex-1 lg:basis-0">
      <ActivityHeader title="최근 신고" />
      <div className="mt-[7px] flex flex-col border-t border-[#B9B9B9]">
        {isLoading ? (
          <ActivityMessage>불러오는 중...</ActivityMessage>
        ) : error ? (
          <ActivityMessage>{error}</ActivityMessage>
        ) : reports.length === 0 ? (
          <ActivityMessage>최근 신고가 없습니다.</ActivityMessage>
        ) : (
          reports.map((report) => (
            <div
              key={`${report.targetType}-${report.targetId}`}
              className="flex h-[44px] items-center gap-[12px] border-b border-[#B9B9B9] pr-[8px]"
            >
              <span className="flex-shrink-0 rounded-[11px] border border-[#AE0000] px-[9px] text-[14px] leading-[1.6] tracking-[-0.28px] text-[#AE0000]">
                신고
              </span>
              <span className="flex-shrink-0 text-[16px] leading-[1.6] tracking-[-0.32px] text-[#212121]">
                [{report.boardName}]
              </span>
              <span className="min-w-0 flex-1 truncate text-[16px] leading-[1.6] tracking-[-0.32px] text-[#212121]">
                &ldquo;{report.preview}&rdquo;
              </span>
              <span className="flex-shrink-0 text-[14px] leading-[1.6] tracking-[-0.28px] text-[#919191]">
                {formatDotDate(report.createdAt)}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// 최근 가입 회원 목록
function RecentMembers({ members, isLoading, error }) {
  return (
    <div className="flex w-full flex-col lg:flex-1 lg:basis-0">
      <ActivityHeader title="최근 가입 회원" />
      <div className="mt-[7px] flex flex-col border-t border-[#B9B9B9]">
        {isLoading ? (
          <ActivityMessage>불러오는 중...</ActivityMessage>
        ) : error ? (
          <ActivityMessage>{error}</ActivityMessage>
        ) : members.length === 0 ? (
          <ActivityMessage>최근 가입한 회원이 없습니다.</ActivityMessage>
        ) : (
          members.map((member) => (
            <div
              key={member.userId}
              className="flex h-[44px] items-center border-b border-[#B9B9B9] pl-[10px] pr-[8px]"
            >
              <span className="text-[18px] leading-[1.6] tracking-[-0.36px] text-[#212121]">
                {MEMBER_TYPE_LABELS[member.memberType] ?? member.memberType}
              </span>
              <span className="mx-[10px] h-[15px] w-px flex-shrink-0 bg-[#B9B9B9]" />
              <span className="text-[18px] leading-[1.6] tracking-[-0.36px] text-[#212121]">
                {member.loginId}
              </span>
              <span className="mx-[10px] h-[15px] w-px flex-shrink-0 bg-[#B9B9B9]" />
              <span className="text-[18px] leading-[1.6] tracking-[-0.36px] text-[#212121]">
                {member.name}
              </span>
              <span className="ml-auto text-[14px] leading-[1.6] tracking-[-0.28px] text-[#919191]">
                {formatDotDate(member.joinedAt)} 가입
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// 최근 신고 / 최근 가입 회원을 합치는 섹션
export default function RecentActivitySection({
  reports = [],
  isReportsLoading = false,
  reportsError = null,
  members = [],
  isMembersLoading = false,
  membersError = null,
}) {
  return (
    <div className="flex w-full flex-col gap-10 lg:flex-row lg:gap-[28px]">
      <RecentReports reports={reports} isLoading={isReportsLoading} error={reportsError} />
      <RecentMembers members={members} isLoading={isMembersLoading} error={membersError} />
    </div>
  );
}
