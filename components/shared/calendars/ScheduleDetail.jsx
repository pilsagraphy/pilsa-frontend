'use client';

import ScheduleDetailTitle from '@/components/shared/calendars/ScheduleDetailTitle';
import ScheduleDetailCategory from '@/components/shared/calendars/ScheduleDetailCategory';
import ScheduleDetailDateTime from '@/components/shared/calendars/ScheduleDetailDateTime';
import ScheduleDetailContent from '@/components/shared/calendars/ScheduleDetailContent';

// 월별 일정에서 고른 일정 하나의 상세.
// 고른 일정이 없으면(목록에서 다시 눌러 접었을 때) 아무것도 그리지 않는다.
//
// fullWidth: 위 달력 블록과 같은 폭으로 늘린다. (관리자 화면 — 수정 폼과 폭을 맞추기 위함)
//            기본값은 시안 폭 785px.
export default function ScheduleDetail({ schedule, fullWidth = false }) {
  if (!schedule) return null;

  return (
    <section
      className={`w-full border-t border-[#DEDEDE] pt-6 md:pt-[30px] ${fullWidth ? '' : 'max-w-[785px]'}`}
    >
      <ScheduleDetailTitle title={schedule.title} />

      <dl className="mt-4 flex flex-col gap-[6px] px-1 md:mt-[14px] md:px-[26px]">
        <ScheduleDetailCategory category={schedule.category} />
        <ScheduleDetailDateTime
          startDate={schedule.startDate}
          endDate={schedule.endDate}
          startTime={schedule.startTime}
          endTime={schedule.endTime}
        />
      </dl>

      <div className="mt-6 px-1 md:mt-[40px] md:px-[26px]">
        <ScheduleDetailContent content={schedule.content} />
      </div>
    </section>
  );
}
