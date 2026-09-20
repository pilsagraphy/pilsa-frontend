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
 *
 * 날짜를 골라도 창은 그대로 열려 있고, 확인을 눌러야 폼에 반영되며 닫힌다.
 * triggerRef: 이 창을 여는 달력 버튼. 버튼 클릭을 '바깥 클릭'으로 세면
 *             닫자마자 버튼의 토글이 다시 열어 버려서 예외로 둔다.
 */
export default function ScheduleDatePicker({ start, end, triggerRef, onConfirm, onClose, single = false }) {
  const [month, setMonth] = React.useState(() => toDate(start));

  // 고르는 중인 구간. 시작만 찍힌 상태에서는 end가 null이다.
  // 시작 · 종료를 따로 두면 한 번에 두 번 눌렸을 때 앞선 상태를 못 읽으므로 한 덩어리로 든다.
  const [draft, setDraft] = React.useState(() => ({
    start: startOfDay(toDate(start)),
    end: startOfDay(toDate(end)),
  }));

  const rootRef = React.useRef(null);

  React.useEffect(() => {
    const handlePointerDown = (event) => {
      if (rootRef.current?.contains(event.target)) return;
      if (triggerRef?.current?.contains(event.target)) return;
      onClose?.();
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
  }, [onClose, triggerRef]);

  const isInDraft = (date) => {
    if (!draft.start) return false;
    if (!draft.end) return isSameDay(startOfDay(date), draft.start);

    return isWithinInterval(startOfDay(date), { start: draft.start, end: draft.end });
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

    // 하루만 고르는 칸(DateField)은 누르는 즉시 확정 — 확인 버튼까지 가지 않는다
    if (single) {
      onConfirm?.(toParts(picked), toParts(picked));
      return;
    }

    setDraft((prev) => {
      // 구간이 다 잡혀 있으면 새로 시작한다.
      if (!prev.start || prev.end) return { start: picked, end: null };

      // 거꾸로 눌렀으면 앞뒤를 바꿔서 잡는다.
      return picked < prev.start
        ? { start: picked, end: prev.start }
        : { start: prev.start, end: picked };
    });
  };

  // 종료일을 안 고르고 확인하면 하루짜리 일정으로 본다.
  const handleConfirm = () => {
    if (!draft.start) {
      onClose?.();
      return;
    }

    onConfirm?.(toParts(draft.start), toParts(draft.end ?? draft.start));
  };

  // 고른 기간을 글자로 — 달력의 막대만으로는 어디서 어디까지인지 확신이 안 선다
  const formatDay = (date) => `${date.getMonth() + 1}월 ${date.getDate()}일`;
  const rangeLabel = !draft.start
    ? '시작일을 골라 주세요'
    : !draft.end
      ? `${formatDay(draft.start)} 부터 — 종료일을 골라 주세요 (같은 날이면 한 번 더)`
      : isSameDay(draft.start, draft.end)
        ? `${formatDay(draft.start)} 하루`
        : `${formatDay(draft.start)} ~ ${formatDay(draft.end)}`;

  const goToday = () => {
    const today = startOfDay(new Date());
    setMonth(today);
    setDraft({ start: today, end: today });
  };

  return (
    <>
      {/* 폰: 뒤를 어둡게 해 달력이 떠 있다는 것을 알린다. 넓은 화면은 버튼 옆에 붙어 있어 필요 없다 */}
      <div aria-hidden className="fixed inset-0 z-40 bg-black/30 md:hidden" />
      <div
        ref={rootRef}
        role="dialog"
        aria-label="날짜 선택"
        // 폰: 화면 가운데 고정. 버튼 기준(absolute)으로 붙이면 버튼이 오른쪽 끝이라 왼쪽이 화면 밖으로 나갔다.
        // md 이상: 버튼 아래 오른쪽 정렬 (원래 자리)
        className="fixed left-1/2 top-1/2 z-50 w-[calc(100vw-32px)] max-w-[392px] -translate-x-1/2 -translate-y-1/2 rounded-[6px] border border-[#dedede] bg-white p-[16px] shadow-[0_4px_16px_rgba(0,0,0,0.1)] md:absolute md:left-auto md:end-0 md:top-[48px] md:z-40 md:w-[392px] md:translate-x-0 md:translate-y-0"
      >
      <div className="mb-[8px] flex items-center justify-between gap-2">
        <p className="min-w-0 truncate text-[13px] leading-[1.6] tracking-[-0.26px] text-[#454545]">
          {single ? '날짜를 누르면 바로 담깁니다' : rangeLabel}
        </p>
        <button
          type="button"
          onClick={goToday}
          className="shrink-0 rounded-[4px] border border-[#dedede] px-[8px] py-[2px] text-[12px] leading-[1.6] text-[#454545] hover:bg-[#f6f6f6]"
        >
          오늘
        </button>
      </div>

      <Calendar
        mode="single"
        month={month}
        onMonthChange={setMonth}
        selected={undefined}
        onSelect={handleSelect}
        modifiers={modifiers}
        className="w-full"
      />

      <div className={`mt-[12px] flex items-center justify-end gap-[12px] ${single ? 'hidden' : ''}`}>
        <button
          type="button"
          onClick={onClose}
          className="h-[40px] w-[80px] rounded-[4px] border border-[#b9b9b9] bg-white text-[14px] leading-[1.6] tracking-[-0.28px] text-[#212121] transition-colors hover:bg-[#f6f6f6]"
        >
          취소
        </button>
        <button
          type="button"
          onClick={handleConfirm}
          className="h-[40px] w-[80px] rounded-[4px] bg-[#212121] text-[14px] leading-[1.6] tracking-[-0.28px] text-white transition-colors hover:bg-[#424242]"
        >
          확인
        </button>
      </div>
      </div>
    </>
  );
}
