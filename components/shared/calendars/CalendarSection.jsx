'use client';

import * as React from 'react';
import { format, isSameDay, isWithinInterval, parseISO, startOfDay } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import MonthlyScheduleList from '@/components/shared/calendars/MonthlyScheduleList';
import ScheduleDetail from '@/components/shared/calendars/ScheduleDetail';
import { calendarMockResponse } from '@/mocks/calendarData';
import { getScheduleList } from '@/apis/schedule';

function isDateIncludedInSchedule(date, schedule) {
  return isWithinInterval(startOfDay(date), {
    start: startOfDay(parseISO(schedule.startDate)),
    end: startOfDay(parseISO(schedule.endDate)),
  });
}

function isScheduleStart(date, schedule) {
  return isSameDay(startOfDay(date), startOfDay(parseISO(schedule.startDate)));
}

function isScheduleEnd(date, schedule) {
  return isSameDay(startOfDay(date), startOfDay(parseISO(schedule.endDate)));
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

  // 조회 단위는 'yyyy-MM'이므로 이걸 기준으로 삼는다.
  // currentMonth(Date)를 그대로 쓰면 같은 달 안에서 날짜만 바뀌어도 재조회가 돌아,
  // 목록이 잠깐 비는 사이 아래 자동 선택 로직이 고른 일정을 첫 번째로 되돌려 놓는다.
  const currentYearMonth = format(currentMonth, 'yyyy-MM');

  React.useEffect(() => {
    let isMounted = true;

    const fetchSchedules = async () => {
      setIsLoading(true);
      setHasFetchError(false);

      try {
        const result = await getScheduleList(currentYearMonth, currentYearMonth);

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
  }, [currentYearMonth]);

  // API 성공 데이터 우선, 실패 시 fallback 사용
  const data = apiResponse ?? (hasFetchError ? fallbackResponse : null);

  // ?? [] 를 그대로 두면 렌더마다 새 배열이 되어 아래 useEffect가 매번 다시 돈다.
  const schedules = React.useMemo(() => data?.data ?? [], [data]);

  React.useEffect(() => {
    // 불러오는 중에는 목록이 잠깐 비므로 선택을 건드리지 않는다.
    if (isLoading) return;

    if (!schedules.length) {
      setSelectedScheduleId(null);
      return;
    }

    // 1. 일정이 있는 날짜들을 추출 (달력에 막대를 그리기 위함)
    // - 목록에 없는 일정이 선택돼 있을 때만(달을 옮겼을 때) 첫 번째 일정으로 맞춘다.
    setSelectedScheduleId((prev) => {
      const exists = schedules.some((schedule) => schedule.scheduleId === prev);
      return exists ? prev : schedules[0].scheduleId;
    });
  }, [schedules, isLoading]);

  // 고른 일정은 달력에서 진한 막대로, 나머지는 연한 막대로 표시하고 아래에 상세를 펼친다.
  const selectedSchedule =
    schedules.find((schedule) => schedule.scheduleId === selectedScheduleId) ?? null;

  // 막대의 양 끝만 둥글게 하려고 시작 · 끝 칸을 따로 구한다.
  // 주가 바뀌면 줄이 끊기므로 일요일 · 토요일도 끝으로 본다.
  const scheduleModifiers = {
    scheduleDay: (date) =>
      schedules.some(
        (schedule) =>
          schedule.scheduleId !== selectedScheduleId && isDateIncludedInSchedule(date, schedule)
      ),
    scheduleActive: (date) =>
      Boolean(selectedSchedule) && isDateIncludedInSchedule(date, selectedSchedule),
    scheduleStart: (date) =>
      schedules.some(
        (schedule) =>
          isDateIncludedInSchedule(date, schedule) &&
          (isScheduleStart(date, schedule) || date.getDay() === 0)
      ),
    scheduleEnd: (date) =>
      schedules.some(
        (schedule) =>
          isDateIncludedInSchedule(date, schedule) &&
          (isScheduleEnd(date, schedule) || date.getDay() === 6)
      ),
  };

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
    <section className="mx-auto flex w-full max-w-[915px] flex-col gap-6 sm:gap-8 lg:gap-[40px]">
      <h2 className="text-[20px] font-semibold tracking-[-0.48px] text-[#212121] sm:text-[24px]">
        일정 달력
      </h2>

      {/* 달력 왼쪽 · 월별 일정 오른쪽.
          사이드바가 tablet(768px)부터 240px를 가져가므로 본문 폭은 늘 뷰포트보다 240px 좁다.
          lg(1024px)로 나누면 본문이 784px뿐이라 두 칸이 안 들어가서, 본문 기준으로 min-[960px]에 나눈다.
          달력은 443px로 고정하고 월별 일정이 남는 폭을 가져간다. (디자인 최대 폭 404px) */}
      <div className="flex w-full flex-col gap-4 sm:gap-5 min-[960px]:flex-row min-[960px]:justify-between min-[960px]:gap-[29px]">
        <div className="w-full bg-white p-4 sm:p-5 min-[960px]:w-[443px] min-[960px]:shrink-0 min-[960px]:p-[24px]">
          <Calendar
            mode="single"
            month={currentMonth}
            onMonthChange={setCurrentMonth}
            selected={selectedDate}
            onSelect={handleSelectDate}
            // 3. 일정이 있는 기간을 modifiers로 전달 (막대 스타일은 ui/calendar.jsx)
            modifiers={scheduleModifiers}
            className="w-full"
          />
        </div>

        <div className="flex w-full min-w-0 flex-col gap-3 sm:gap-[12px] min-[960px]:max-w-[404px] min-[960px]:flex-1">
          <p className="text-[14px] tracking-[-0.32px] text-[#212121] md:text-[16px]">월별 일정</p>

          <MonthlyScheduleList
            schedules={schedules}
            selectedId={selectedScheduleId}
            onSelect={handleSelectSchedule}
            isLoading={isLoading}
          />
        </div>
      </div>

      {/* 4. 고른 일정의 상세
          TODO: API 연동 시 상세(category · content · startTime · endTime)도 함께 내려받을 것.
                지금은 목 데이터에만 있어 실제 응답에서는 기본값으로 그려진다. */}
      <ScheduleDetail schedule={selectedSchedule} />
    </section>
  );
}
