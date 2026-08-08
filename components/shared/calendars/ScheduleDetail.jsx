'use client';

import ScheduleDetailTitle from '@/components/shared/calendars/ScheduleDetailTitle';
import ScheduleDetailCategory from '@/components/shared/calendars/ScheduleDetailCategory';
import ScheduleDetailDateTime from '@/components/shared/calendars/ScheduleDetailDateTime';
import ScheduleDetailContent from '@/components/shared/calendars/ScheduleDetailContent';

// 월별 일정에서 고른 일정 하나의 상세.
// 고른 일정이 없으면(목록에서 다시 눌러 접었을 때) 아무것도 그리지 않는다.
export default function ScheduleDetail({ schedule }) {
  if (!schedule) return null;

  return (
    <section className="w-full max-w-[785px] border-t border-[#DEDEDE] pt-6 md:pt-[30px]">
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
