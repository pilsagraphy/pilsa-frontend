'use client';

import * as React from 'react';
import { addDays, isSameDay, isSameMonth, isWithinInterval, startOfDay, subDays } from 'date-fns';

import { Calendar } from '@/components/ui/calendar';

const pad2 = (n) => String(n).padStart(2, '0');

export function toDate({ year, month, day }) {
  return new Date(Number(year), Number(month) - 1, Number(day));
}

export function toParts(date) {
  return {
    year: String(date.getFullYear()),
    month: pad2(date.getMonth() + 1),
    day: pad2(date.getDate()),
  };
}

/**
 * 일정 폼의 '날짜 / 시간' 옆 달력 버튼을 눌렀을 때 뜨는 기간 선택 달력.
 *
 * 달력은 일반 회원 화면과 같은 ui/calendar를 그대로 쓴다.
 * 고른 구간은 새 CSS를 만들지 않고 그 달력이 이미 갖고 있는 일정 막대 modifier
 * (scheduleActive · scheduleStart · scheduleEnd)로 그린다 — 월별 일정의 진한 막대와 같은 모양.
 *
 * 첫 번째 클릭으로 시작일, 두 번째 클릭으로 종료일을 고른다.
 * (거꾸로 누르면 앞뒤를 바꿔서 잡는다)
 */
export default function ScheduleDatePicker({ start, end, onSelectRange, onClose }) {
  const [month, setMonth] = React.useState(() => toDate(start));

  // 고르는 중인 구간. 시작만 찍힌 상태에서는 draftEnd가 null이다.
  const [draftStart, setDraftStart] = React.useState(() => startOfDay(toDate(start)));
  const [draftEnd, setDraftEnd] = React.useState(() => startOfDay(toDate(end)));

  const rootRef = React.useRef(null);

  React.useEffect(() => {
    const handlePointerDown = (event) => {
      if (!rootRef.current?.contains(event.target)) onClose?.();
    };
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose?.();
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  const isInDraft = (date) => {
    if (!draftStart) return false;
    if (!draftEnd) return isSameDay(startOfDay(date), draftStart);

    return isWithinInterval(startOfDay(date), { start: draftStart, end: draftEnd });
  };

  // 막대의 양 끝만 둥글게 한다. 주가 바뀌거나 달을 벗어나면 거기서 끊어 준다.
  // (CalendarSection의 판정과 같은 규칙)
  const modifiers = {
    scheduleActive: isInDraft,
    scheduleStart: (date) => {
      if (!isInDraft(date)) return false;
      if (date.getDay() === 0) return true;

      const prev = subDays(date, 1);
      return !isSameMonth(prev, month) || !isInDraft(prev);
    },
    scheduleEnd: (date) => {
      if (!isInDraft(date)) return false;
      if (date.getDay() === 6) return true;

      const next = addDays(date, 1);
      return !isSameMonth(next, month) || !isInDraft(next);
    },
  };

  const handleSelect = (date) => {
    if (!date) return;

    const picked = startOfDay(date);

    // 구간이 다 잡혀 있으면 새로 시작한다.
    if (!draftStart || draftEnd) {
      setDraftStart(picked);
      setDraftEnd(null);
      return;
    }

    const [rangeStart, rangeEnd] =
      picked < draftStart ? [picked, draftStart] : [draftStart, picked];

    setDraftStart(rangeStart);
    setDraftEnd(rangeEnd);
    onSelectRange?.(toParts(rangeStart), toParts(rangeEnd));
    onClose?.();
  };

  return (
    <div
      ref={rootRef}
      role="dialog"
      aria-label="날짜 선택"
      className="absolute end-0 top-[48px] z-40 w-[min(392px,calc(100vw-32px))] rounded-[6px] border border-[#dedede] bg-white p-[16px] shadow-[0_4px_16px_rgba(0,0,0,0.1)]"
    >
      <Calendar
        mode="single"
        month={month}
        onMonthChange={setMonth}
        selected={undefined}
        onSelect={handleSelect}
        modifiers={modifiers}
        className="w-full"
      />

      <p className="mt-[8px] text-center text-[12px] leading-[1.6] tracking-[-0.24px] text-[#919191]">
        {draftEnd ? '시작일을 다시 누르면 새로 고를 수 있어요.' : '종료일을 골라 주세요.'}
      </p>
    </div>
  );
}
