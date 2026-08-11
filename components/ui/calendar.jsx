'use client';

import * as React from 'react';
import { DayPicker } from 'react-day-picker';
import { ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';
import { ko } from 'date-fns/locale';

const EN_WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

function SelectWithChevron({ value, onChange, children, ariaLabel }) {
  return (
    <div className="relative inline-flex items-center">
      <select
        value={value}
        onChange={onChange}
        aria-label={ariaLabel}
        className="h-8 cursor-pointer bg-transparent pr-4 text-[14px] font-normal text-neutral-900 appearance-none outline-none sm:h-9 sm:text-[16px]"
      >
        {children}
      </select>
      <ChevronDown
        className="pointer-events-none absolute right-0 h-3.5 w-3.5 text-neutral-700"
        strokeWidth={1.5}
      />
    </div>
  );
}

// 일정 막대에 쓰는 modifier 이름 → 클래스. 막대 CSS가 이 파일에 있으므로 매핑도 여기서 들고 있는다.
// CalendarSection이 modifiers로 scheduleDay · scheduleActive · scheduleStart · scheduleEnd를 넘기면 된다.
const SCHEDULE_MODIFIER_CLASS_NAMES = {
  scheduleDay: 'pilsa-schedule-day',
  scheduleActive: 'pilsa-schedule-active',
  scheduleStart: 'pilsa-schedule-start',
  scheduleEnd: 'pilsa-schedule-end',
};

export function Calendar({
  className = '',
  classNames,
  modifiersClassNames,
  showOutsideDays = true,
  modifiers,
  month: controlledMonth,
  onMonthChange,
  ...props
}) {
  const [internalMonth, setInternalMonth] = React.useState(() => new Date());
  const month = controlledMonth ?? internalMonth;

  const setMonth = (next) => {
    onMonthChange?.(next);
    if (!controlledMonth) setInternalMonth(next);
  };

  const goPrev = () => {
    const d = new Date(month);
    d.setMonth(d.getMonth() - 1);
    setMonth(d);
  };

  const goNext = () => {
    const d = new Date(month);
    d.setMonth(d.getMonth() + 1);
    setMonth(d);
  };

  const handleChangeMonth = (e) => {
    const d = new Date(month);
    d.setMonth(Number(e.target.value));
    setMonth(d);
  };

  const handleChangeYear = (e) => {
    const d = new Date(month);
    d.setFullYear(Number(e.target.value));
    setMonth(d);
  };

  const m = month.getMonth();
  const y = month.getFullYear();

  const years = [];
  for (let yy = y - 20; yy <= y + 20; yy += 1) years.push(yy);

  const currentMonth = month.getMonth();
  const currentYear = month.getFullYear();

  const CustomDay = React.useCallback(
    ({ day, modifiers: dayModifiers, ...dayProps }) => {
      const date = day.date;
      const isOutside = date.getMonth() !== currentMonth || date.getFullYear() !== currentYear;

      if (isOutside) {
        return (
          <td className="h-10 w-10 p-0 text-center align-middle sm:h-12 sm:w-12">
            <span
              style={{
                display: 'inline-block',
                width: '4px',
                height: '4px',
                borderRadius: '50%',
                backgroundColor: '#d4d4d4',
              }}
            />
          </td>
        );
      }

      return <td {...dayProps} />;
    },
    [currentMonth, currentYear]
  );

  return (
    <div className={`w-full ${className}`}>
      <style>{`
        /* 오늘이면서 선택된 날. data 속성은 DayPicker가 칸에 직접 붙여준다.
           일정 막대가 그려진 칸은 막대가 우선이므로 제외한다. */
        [data-today][data-selected]:not(.pilsa-schedule-day):not(.pilsa-schedule-active) button {
          background-color: #f5f5f5 !important;
          border-radius: 9999px !important;
        }

        /* 일정 막대(pill)
           칸(td) 자체에 배경을 주면 border-collapse 때문에 모서리가 둥글어지지 않아서,
           칸 안쪽에 ::before를 깔아 막대를 그린다. 이웃한 칸끼리 좌우로 붙어 한 줄로 이어진다. */
        .pilsa-schedule-day,
        .pilsa-schedule-active {
          position: relative;
        }
        .pilsa-schedule-day::before,
        .pilsa-schedule-active::before {
          content: '';
          position: absolute;
          top: 4px;
          right: -1px;
          bottom: 4px;
          left: -1px;
          background-color: #f6f6f6;
        }
        .pilsa-schedule-active::before {
          background-color: #454545;
        }
        /* 칸마다 따로 그리다 보니 딱 붙여만 두면 두 경계가 각각 안티에일리어싱되어
           날짜 사이에 옅은 세로선이 보인다. 이어지는 쪽만 1px씩 겹치게 해서 이음매를 없앤다.
           막대의 시작 · 끝 칸은 겹칠 이웃이 없으므로 칸 경계에 맞추고 둥글게 잘라 알약 모양을 만든다. */
        .pilsa-schedule-start::before {
          left: 0;
          border-top-left-radius: 9999px;
          border-bottom-left-radius: 9999px;
        }
        .pilsa-schedule-end::before {
          right: 0;
          border-top-right-radius: 9999px;
          border-bottom-right-radius: 9999px;
        }
        /* 날짜 숫자는 막대 위로 올리고, 선택된 날 회색 원이 막대를 덮지 않도록 배경을 지운다.
           selected에 붙는 Tailwind 유틸도 !important라서 선언 순서 싸움이 된다.
           td를 붙여 선택자 명시도를 한 단계 높여 순서와 무관하게 이기도록 한다. */
        td.pilsa-schedule-day > button,
        td.pilsa-schedule-active > button {
          position: relative;
          z-index: 1;
          background-color: transparent !important;
        }
        td.pilsa-schedule-active > button {
          color: #ffffff !important;
        }
      `}</style>

      <div className="relative mx-auto w-full max-w-[272px] pb-2 pt-1 sm:max-w-[336px]">
        <button
          type="button"
          onClick={goPrev}
          aria-label="이전 달"
          className="absolute left-0 top-1/2 -translate-y-1/2 p-0.5 text-neutral-900 hover:opacity-70 sm:left-[-10px] sm:p-1"
        >
          <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" strokeWidth={1.25} />
        </button>

        <div className="flex items-center justify-center gap-6 sm:gap-14">
          <SelectWithChevron value={m} onChange={handleChangeMonth} ariaLabel="월 선택">
            {Array.from({ length: 12 }).map((_, i) => (
              <option key={i} value={i}>
                {i + 1}월
              </option>
            ))}
          </SelectWithChevron>

          <SelectWithChevron value={y} onChange={handleChangeYear} ariaLabel="년 선택">
            {years.map((yy) => (
              <option key={yy} value={yy}>
                {yy}년
              </option>
            ))}
          </SelectWithChevron>
        </div>

        <button
          type="button"
          onClick={goNext}
          aria-label="다음 달"
          className="absolute right-0 top-1/2 -translate-y-1/2 p-0.5 text-neutral-900 hover:opacity-70 sm:right-[-10px] sm:p-1"
        >
          <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" strokeWidth={1.25} />
        </button>
      </div>

      <DayPicker
        {...props}
        locale={ko}
        month={month}
        onMonthChange={setMonth}
        showOutsideDays={showOutsideDays}
        modifiers={modifiers}
        modifiersClassNames={{ ...SCHEDULE_MODIFIER_CLASS_NAMES, ...modifiersClassNames }}
        className="p-0"
        formatters={{
          formatWeekdayName: (date) => EN_WEEKDAYS[date.getDay()],
        }}
        components={{ Day: CustomDay }}
        // v9 키만 사용한다. v8 키(caption · table · head_row · head_cell · cell)는
        // 조용히 무시되므로 남겨두면 죽은 코드가 된다.
        // 월 · 년은 위쪽 커스텀 select로 직접 그리므로 기본 캡션과 nav는 숨긴다.
        classNames={{
          caption_label: 'hidden',
          nav: 'hidden',
          months: 'flex flex-col items-center',
          month: 'space-y-2',
          month_grid: 'mx-auto border-collapse',
          // weekdays(구 head_row)에는 flex를 주지 않는다. <tr>이 flex가 되면
          // <th>가 table-cell을 잃어 본문 칸과 열이 어긋난다.
          weekday:
            'w-10 p-0 text-center text-[11px] font-normal text-neutral-400 sm:w-12 sm:text-[14px]',
          day: 'h-10 w-10 p-0 text-center align-middle bg-transparent sm:h-12 sm:w-12',
          day_button:
            'flex h-10 w-10 items-center justify-center rounded-full bg-transparent text-[13px] font-normal text-neutral-900 outline-none hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 sm:h-12 sm:w-12 sm:text-[16px]',
          selected: '[&>button]:!bg-neutral-100 [&>button]:!rounded-full',
          today: 'bg-transparent',
          outside: 'pointer-events-none',
          disabled: 'text-neutral-300 opacity-50',
          ...classNames,
        }}
      />
    </div>
  );
}
