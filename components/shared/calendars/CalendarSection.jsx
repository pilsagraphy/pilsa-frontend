'use client';

import * as React from 'react';
import {
  addDays,
  format,
  isSameMonth,
  isWithinInterval,
  parseISO,
  startOfDay,
  subDays,
} from 'date-fns';
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

// 한 칸에 그려지는 막대는 '고른 일정'(ACTIVE) 아니면 '그 외 일정들'(OTHER) 중 하나다.
//
// 일정이 같은 날에 겹칠 때는 고른 일정만 보인다(= 겹치는 날의 나머지 일정은 가려진다).
// 디자인 확정 사항이다. 한 칸에 막대를 여러 줄로 겹쳐 그리는 방식은 다음 기수에서 검토한다.
// CSS 선언 순서에 기대지 않도록 두 층을 여기서 상호 배타로 갈라 둔다.
const LAYER_ACTIVE = 'active';
const LAYER_OTHER = 'other';

// renderScheduleAction: 월별 일정 카드 오른쪽에 놓을 조작 버튼 (관리자 화면의 ⋮ 메뉴)
// renderDetail: 목록 아래에 그릴 내용. 기본은 읽기용 일정 상세다.
//               관리자 화면은 '일정 수정' 폼으로 갈아끼우려고 열어 뒀다.
export default function CalendarSection({
  response,
  renderScheduleAction,
  renderDetail,
  scrollableScheduleList = true,
}) {
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
    // response prop이 들어오면 그 값을 그대로 쓰고 조회하지 않는다.
    // (목 데이터로 화면을 확인할 때 사용 — 조회가 돌면 prop이 덮어써져 무의미해진다)
    if (response) {
      setApiResponse(response);
      setIsLoading(false);
      return;
    }

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
  }, [currentYearMonth, response]);

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

  // 그 날 칸에 어떤 막대가 그려지는지 판정한다. 일정이 없으면 null.
  const layerOfDate = (date) => {
    if (selectedSchedule && isDateIncludedInSchedule(date, selectedSchedule)) return LAYER_ACTIVE;

    const inOther = schedules.some(
      (schedule) =>
        schedule.scheduleId !== selectedScheduleId && isDateIncludedInSchedule(date, schedule)
    );

    return inOther ? LAYER_OTHER : null;
  };

  // 막대의 양 끝만 둥글게 하려고 시작 · 끝 칸을 구한다.
  // 일정별로 따로 보면 'A의 중간이면서 B의 시작'인 칸에서 라운딩이 어긋나므로,
  // 실제로 칠해지는 막대(층)를 기준으로 "어제/내일이 같은 층인가"만 본다.
  const scheduleModifiers = {
    scheduleDay: (date) => layerOfDate(date) === LAYER_OTHER,
    scheduleActive: (date) => layerOfDate(date) === LAYER_ACTIVE,
    scheduleStart: (date) => {
      const layer = layerOfDate(date);
      if (!layer) return false;

      // 주가 바뀌면 줄이 끊기고, 지난 달 칸은 점으로만 표시되므로 둘 다 시작으로 본다.
      if (date.getDay() === 0) return true;

      const prev = subDays(date, 1);
      if (!isSameMonth(prev, currentMonth)) return true;

      return layerOfDate(prev) !== layer;
    },
    scheduleEnd: (date) => {
      const layer = layerOfDate(date);
      if (!layer) return false;

      if (date.getDay() === 6) return true;

      const next = addDays(date, 1);
      if (!isSameMonth(next, currentMonth)) return true;

      return layerOfDate(next) !== layer;
    },
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
    // updater 안에서 다른 setState를 호출하면 Strict Mode가 updater를 두 번 부를 때 같이 두 번 돌므로,
    // prev 대신 selectedDate를 직접 읽어 토글을 계산하고 setState는 밖에서 따로 호출한다.
    const isSame = selectedDate?.getTime() === d.getTime();
    const nextDate = isSame ? undefined : d;

    setSelectedDate(nextDate);

    // 같은 날을 다시 눌러 날짜 선택만 푼 경우는 일정 강조를 그대로 둔다.
    if (!nextDate) return;

    // 2. 선택한 날짜에 포함된 일정이 있으면 해당 리스트 아이템 강조, 없으면 강조 해제
    //    (해제하면 아래 일정 상세도 함께 닫힌다)
    const found = schedules.find((schedule) => isDateIncludedInSchedule(nextDate, schedule));

    setSelectedScheduleId(found ? found.scheduleId : null);
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
            renderAction={renderScheduleAction}
            scrollable={scrollableScheduleList}
          />
        </div>
      </div>

      {/* 4. 고른 일정의 상세
          TODO: API 연동 시 상세(category · content · startTime · endTime)도 함께 내려받을 것.
                지금은 목 데이터에만 있어 실제 응답에서는 기본값으로 그려진다. */}
      {renderDetail ? (
        renderDetail(selectedSchedule)
      ) : (
        <ScheduleDetail schedule={selectedSchedule} />
      )}
    </section>
  );
}
