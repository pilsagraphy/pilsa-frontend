'use client';

import * as React from 'react';
import { Calendar } from '@/components/ui/calendar';
import MonthlyScheduleList from '@/components/shared/calendars/MonthlyScheduleList';
import { calendarMockResponse } from '@/mocks/calendarData';
import { isWithinInterval, parseISO, startOfDay } from 'date-fns';

export default function CalendarSection({ response }) {
  const data = response ?? calendarMockResponse;
  const schedules = data?.data ?? [];

  const [selectedDate, setSelectedDate] = React.useState(undefined);
  const [selectedScheduleId, setSelectedScheduleId] = React.useState(
    schedules[0]?.scheduleId ?? null
  );

  // 1. 일정이 있는 날짜들을 추출 (달력에 점을 찍기 위함)
  const scheduledDays = React.useMemo(() => {
    return schedules.map((s) => ({
      start: startOfDay(parseISO(s.startDate)),
      end: startOfDay(parseISO(s.endDate)),
    }));
  }, [schedules]);

  const handleSelectSchedule = (schedule) => {
    setSelectedScheduleId(schedule.scheduleId);
    // 선택한 일정의 시작일로 달력 날짜도 맞춰줌 (역방향 상호작용)
    setSelectedDate(parseISO(schedule.startDate));
  };

  const handleSelectDate = (d) => {
    if (!d) return;

    // 날짜 토글 로직
    setSelectedDate((prev) => {
      const isSame = prev?.getTime() === d.getTime();
      const nextDate = isSame ? undefined : d;

      // 2. 선택한 날짜에 포함된 일정이 있다면 해당 리스트 아이템 강조
      if (nextDate) {
        const found = schedules.find((s) =>
          isWithinInterval(startOfDay(nextDate), {
            start: startOfDay(parseISO(s.startDate)),
            end: startOfDay(parseISO(s.endDate)),
          })
        );
        if (found) setSelectedScheduleId(found.scheduleId);
      }

      return nextDate;
    });
  };

  return (
    <section className="mx-auto flex w-full max-w-[915px] flex-col gap-[40px]">
      <h2 className="text-[24px] font-semibold tracking-[-0.48px] text-[#212121]">일정 달력</h2>

      <div className="flex w-full flex-col gap-[24px] lg:flex-row lg:gap-[45px]">
        <div className="w-full bg-white p-[24px] lg:w-[443px]">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={handleSelectDate}
            // 3. 일정이 있는 날짜를 modifiers로 전달
            modifiers={{
              hasEvent: (date) =>
                schedules.some((s) =>
                  isWithinInterval(startOfDay(date), {
                    start: startOfDay(parseISO(s.startDate)),
                    end: startOfDay(parseISO(s.endDate)),
                  })
                ),
            }}
            className="w-full"
          />
        </div>

        <div className="flex w-full flex-col gap-[12px] lg:w-[427px]">
          <p className="text-[18px] tracking-[-0.36px] text-[#212121]">월별 일정</p>
          <MonthlyScheduleList
            schedules={schedules}
            selectedId={selectedScheduleId}
            onSelect={handleSelectSchedule}
            maxHeight={380}
          />
        </div>
      </div>
    </section>
  );
}
