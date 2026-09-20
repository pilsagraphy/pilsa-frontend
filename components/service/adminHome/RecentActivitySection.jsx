'use client';
import React from 'react';
import { useRouter } from 'next/navigation';
import { formatDotDate } from '@/lib/utils';
import { ROUTES } from '@/constants/routes';

// 회원 신분 코드 → 화면 라벨 (회원가입 화면과 동일 규칙)
const MEMBER_TYPE_LABELS = { STUDENT: '재학생', ALUMNI: '졸업생' };

// 섹션 헤더: 제목 + 전체보기 → (누르면 해당 관리 페이지로 이동)
function ActivityHeader({ title, onViewAll }) {
  return (
    <div className="flex h-[44px] items-center justify-between">
      <h3 className="text-[20px] font-semibold leading-[1.5] tracking-[-0.4px] text-[#212121]">
        {title}
      </h3>
      {/* 메인 탑5 · 글 하단 '목록'과 같은 선 화살표 — 사이트 안의 '더 보기' 화살표를 하나로 */}
      <button
        type="button"
        onClick={onViewAll}
        aria-label={`${title} 전체보기`}
        title="전체보기"
        className="flex h-[24px] cursor-pointer items-center justify-center rounded-sm px-[2px] text-[#212121] transition hover:bg-[#F6F6F6]"
      >
        <svg width="50" height="10" viewBox="0 0 50 10" fill="none" aria-hidden="true">
          <path
            d="M0 5H49M44 1L49 5L44 9"
            stroke="currentColor"
            strokeWidth="1"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
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
function RecentReports({ reports, isLoading, error, onViewAll }) {
  return (
    <div className="flex w-full flex-col lg:flex-1 lg:basis-0">
      <ActivityHeader title="최근 신고" onViewAll={onViewAll} />
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
function RecentMembers({ members, isLoading, error, onViewAll }) {
  return (
    <div className="flex w-full flex-col lg:flex-1 lg:basis-0">
      <ActivityHeader title="최근 가입 회원" onViewAll={onViewAll} />
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
              {/* 폭이 모자라면 줄을 바꾸지 않고 말줄임한다 — '재학/생' 처럼 글자가 끊기면 못 읽는다.
                  신분과 날짜는 그대로 두고 아이디·이름이 줄어든다 */}
              <span className="shrink-0 whitespace-nowrap text-[15px] font-semibold leading-[1.6] tracking-[-0.3px] text-[#212121] md:text-[16px]">
                {MEMBER_TYPE_LABELS[member.memberType] ?? member.memberType}
              </span>

              <span className="mx-[8px] h-[15px] w-px flex-shrink-0 bg-[#B9B9B9] md:mx-[10px]" />

              <span
                title={member.loginId}
                className="min-w-0 max-w-[38%] truncate text-[15px] leading-[1.6] tracking-[-0.3px] text-[#212121] md:text-[16px]"
              >
                {member.loginId}
              </span>

              <span className="mx-[8px] h-[15px] w-px flex-shrink-0 bg-[#B9B9B9] md:mx-[10px]" />

              <span
                title={member.name}
                className="min-w-0 flex-1 truncate text-[15px] leading-[1.6] tracking-[-0.3px] text-[#212121] md:text-[16px]"
              >
                {member.name}
              </span>

              <span className="ml-[8px] shrink-0 whitespace-nowrap text-[13px] leading-[1.6] tracking-[-0.26px] text-[#919191] md:ml-auto md:text-[14px]">
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
  const router = useRouter();

  return (
    <div className="flex w-full flex-col gap-10 lg:flex-row lg:gap-[28px]">
      <RecentReports
        reports={reports}
        isLoading={isReportsLoading}
        error={reportsError}
        onViewAll={() => router.push(ROUTES.ADMIN_REPORTS)}
      />
      <RecentMembers
        members={members}
        isLoading={isMembersLoading}
        error={membersError}
        onViewAll={() => router.push(ROUTES.ADMIN_MEMBER_LIST)}
      />
    </div>
  );
}
