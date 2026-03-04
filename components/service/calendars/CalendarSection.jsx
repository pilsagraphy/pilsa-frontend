'use client';

import * as React from 'react';
import { Calendar } from '@/components/ui/calendar';
import MonthlyScheduleList from '@/components/service/calendars/MonthlyScheduleList';
import { calendarMockResponse } from '@/mocks/calendarData';

export default function CalendarSection({ response }) {
  // response prop이 없으면 mock 데이터 사용 (개발용)
  const data = response ?? calendarMockResponse;
  const schedules = data?.data ?? [];

  const [selectedDate, setSelectedDate] = React.useState(undefined);
  const [selectedScheduleId, setSelectedScheduleId] = React.useState(
    schedules[0]?.scheduleId ?? null
  );

  const handleSelectSchedule = (schedule) => {
    setSelectedScheduleId(schedule.scheduleId);
  };

  const handleSelectDate = (d) => {
    if (!d) return;
    setSelectedDate((prev) => {
      if (!prev) return d;
      const same =
        prev.getFullYear() === d.getFullYear() &&
        prev.getMonth() === d.getMonth() &&
        prev.getDate() === d.getDate();
      return same ? undefined : d;
    });
  };

  return (
    <section className="mx-auto flex w-full max-w-[915px] flex-col gap-[40px]">
      <h2 className="text-[24px] font-semibold tracking-[-0.48px] text-[#212121]">일정 달력</h2>

      <div className="flex w-full flex-col gap-[24px] lg:flex-row lg:gap-[45px]">
        {/* 달력 */}
        <div className="w-full bg-white p-[24px] lg:w-[443px]">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={handleSelectDate}
            className="w-full"
          />
        </div>

        {/* 월별 일정 목록 */}
        <div className="flex w-full flex-col gap-[12px] lg:w-[427px]">
          <div className="flex items-center pr-[12px]">
            <p className="text-[18px] tracking-[-0.36px] text-[#212121]">월별 일정</p>
          </div>

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
