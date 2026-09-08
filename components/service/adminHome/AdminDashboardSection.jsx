'use client';
import React from 'react';
import StatsSection from './StatsSection';
import Schedule from './Schedule';
import RecentActivitySection from './RecentActivitySection';
import {
  CALENDAR_COLUMN_MAX_W,
  CALENDAR_DETAIL_MAX_W,
} from '@/components/shared/calendars/calendarLayout';

// 관리자 홈의 달력은 일정을 골라도 아래 상세를 펼치지 않는다. (왼쪽 달력 강조만 남긴다)
// 상세를 빈 값으로 그려 CalendarSection이 기본 ScheduleDetail을 렌더하지 않게 한다.
const renderNoDetail = () => null;

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
        {/* 인사말 아래 회색선('초록박스')은 아래 일정 상세의 회색선('빨간박스', ScheduleDetail)과
            같은 폭 상수를 그대로 거친다. 바깥은 열 폭(915)으로 가운데 정렬하고, 안쪽 선은 상세 폭(785)으로
            왼쪽 정렬 — 상세와 같은 부모 규칙을 공유하므로 어떤 화면 폭에서도 두 선의 가로 길이가 일치한다. */}
        <div className={`mx-auto w-full ${CALENDAR_COLUMN_MAX_W}`}>
          <div className={`w-full border-b border-[#DEDEDE] ${CALENDAR_DETAIL_MAX_W}`} />
        </div>
      </div>

      {/* 영역 2: 통계 카드 */}
      <StatsSection />

      {/* 영역 3: 일정 달력 (홈에서는 일정 상세를 펼치지 않음) */}
      <Schedule renderDetail={renderNoDetail} />

      {/* 영역 4: 최근 신고 / 최근 가입 회원 */}
      <RecentActivitySection />
    </section>
  );
}
