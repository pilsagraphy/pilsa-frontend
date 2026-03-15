'use client';

import * as React from 'react';
import { format, isWithinInterval, parseISO, startOfDay } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import MonthlyScheduleList from '@/components/shared/calendars/MonthlyScheduleList';
import { calendarMockResponse } from '@/mocks/calendarData';
import { getScheduleList } from '@/apis/schedule';

function isDateIncludedInSchedule(date, schedule) {
  return isWithinInterval(startOfDay(date), {
    start: startOfDay(parseISO(schedule.startDate)),
    end: startOfDay(parseISO(schedule.endDate)),
  });
}

export default function CalendarSection({ response }) {
  // 기존 response prop이 들어오면 그걸 우선 fallback으로 사용
  const fallbackResponse = React.useMemo(() => response ?? calendarMockResponse, [response]);

  const [currentMonth, setCurrentMonth] = React.useState(new Date());
  const [apiResponse, setApiResponse] = React.useState(response ?? null);
  const [isLoading, setIsLoading] = React.useState(!response);
  const [hasFetchError, setHasFetchError] = React.useState(false);

  const [selectedDate, setSelectedDate] = React.useState(undefined);
  const [selectedScheduleId, setSelectedScheduleId] = React.useState(null);

  React.useEffect(() => {
    let isMounted = true;

    const fetchSchedules = async () => {
      const yearMonth = format(currentMonth, 'yyyy-MM');

      setIsLoading(true);
      setHasFetchError(false);

      try {
        const result = await getScheduleList(yearMonth, yearMonth);

        if (!isMounted) return;
        setApiResponse(result);
      } catch (error) {
        console.error('일정 목록 조회 실패:', error);

        if (!isMounted) return;
        setHasFetchError(true);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchSchedules();

    return () => {
      isMounted = false;
    };
  }, [currentMonth]);

  // API 성공 데이터 우선, 실패 시 fallback 사용
  const data = apiResponse ?? (hasFetchError ? fallbackResponse : null);
  const schedules = data?.data ?? [];

  React.useEffect(() => {
    if (!schedules.length) {
      setSelectedScheduleId(null);
      return;
    }

    // 1. 일정이 있는 날짜들을 추출 (달력에 점을 찍기 위함)
    // - 첫 번째 일정의 시작일로 달력 날짜도 맞춰줌 (역방향 상호작용)
    setSelectedScheduleId((prev) => {
      const exists = schedules.some((schedule) => schedule.scheduleId === prev);
      return exists ? prev : schedules[0].scheduleId;
    });
  }, [schedules]);

  const handleSelectSchedule = (schedule) => {
    const start = parseISO(schedule.startDate);

    setSelectedScheduleId(schedule.scheduleId);
    setSelectedDate(start);
    setCurrentMonth(start);
  };

  const handleSelectDate = (d) => {
    if (!d) return;

    // 날짜 토글 로직
    setSelectedDate((prev) => {
      const isSame = prev?.getTime() === d.getTime();
      const nextDate = isSame ? undefined : d;

      // 2. 선택한 날짜에 포함된 일정이 있다면 해당 리스트 아이템 강조
      if (nextDate) {
        const found = schedules.find((schedule) => isDateIncludedInSchedule(nextDate, schedule));

        if (found) {
          setSelectedScheduleId(found.scheduleId);
        }
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
            month={currentMonth}
            onMonthChange={setCurrentMonth}
            selected={selectedDate}
            onSelect={handleSelectDate}
            // 3. 일정이 있는 날짜를 modifiers로 전달
            modifiers={{
              hasEvent: (date) =>
                schedules.some((schedule) => isDateIncludedInSchedule(date, schedule)),
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
            isLoading={isLoading}
          />
        </div>
      </div>
    </section>
  );
}
