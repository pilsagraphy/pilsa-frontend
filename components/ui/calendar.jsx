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

export function Calendar({
  className = '',
  classNames,
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
        .rdp-day_today.rdp-day_selected button,
        .rdp-day_today.rdp-day_selected .rdp-day_button,
        [data-today][data-selected] button,
        [data-today][data-selected] .rdp-day_button {
          background-color: #f5f5f5 !important;
          border-radius: 9999px !important;
        }

        /* 점(Dot) 스타일 추가 */
        .rdp-day_hasEvent .rdp-day_button::after {
          content: '';
          position: absolute;
          bottom: 2px;
          left: 50%;
          transform: translateX(-50%);
          width: 3px;
          height: 3px;
          border-radius: 50%;
          background-color: #212121;
        }
        @media (min-width: 640px) {
          .rdp-day_hasEvent .rdp-day_button::after {
            bottom: 4px;
            width: 4px;
            height: 4px;
          }
        }
        .rdp-day_selected.rdp-day_hasEvent .rdp-day_button::after {
          background-color: #212121;
        }

        .rdp-day_button { position: relative; }
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
        className="p-0"
        formatters={{
          formatWeekdayName: (date) => EN_WEEKDAYS[date.getDay()],
        }}
        components={{ Day: CustomDay }}
        classNames={{
          caption: 'hidden',
          caption_label: 'hidden',
          nav: 'hidden',
          months: 'flex flex-col items-center',
          month: 'space-y-2',
          table: 'mx-auto border-collapse',
          head_row: 'flex',
          weekday: 'text-neutral-400 font-normal text-[11px] sm:text-[14px]',
          head_cell:
            'w-10 text-center text-[11px] text-neutral-400 font-normal sm:w-12 sm:text-[14px]',
          cell: 'h-10 w-10 p-0 text-center align-middle bg-transparent sm:h-12 sm:w-12',
          day_button:
            'flex h-10 w-10 items-center justify-center rounded-full bg-transparent text-[13px] font-normal text-neutral-900 outline-none hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 sm:h-12 sm:w-12 sm:text-[16px]',
          selected:
            '[&>button]:!bg-neutral-100 [&>button]:!rounded-full [&_.rdp-day_button]:!bg-neutral-100 [&_.rdp-day_button]:!rounded-full',
          today: 'bg-transparent',
          outside: 'pointer-events-none',
          disabled: 'text-neutral-300 opacity-50',
          day_hasEvent: 'rdp-day_hasEvent',
          ...classNames,
        }}
      />
    </div>
  );
}
