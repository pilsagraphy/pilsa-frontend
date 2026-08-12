'use client';

import { parseISO } from 'date-fns';
import { Plus } from 'lucide-react';

// 목록에서는 날짜를 짧게 적는다.
// 하루: '10월 20일' / 같은 달: '10월 20~21일' / 달이 다르면: '10월 20일 ~ 11월 2일'
function formatDateRange(startDate, endDate) {
  if (!startDate) return '';

  const start = parseISO(startDate);
  if (Number.isNaN(start.getTime())) return startDate;

  const startText = `${start.getMonth() + 1}월 ${start.getDate()}일`;
  if (!endDate || endDate === startDate) return startText;

  const end = parseISO(endDate);
  if (Number.isNaN(end.getTime())) return startText;

  const isSameMonth =
    start.getFullYear() === end.getFullYear() && start.getMonth() === end.getMonth();

  if (isSameMonth) {
    return `${start.getMonth() + 1}월 ${start.getDate()}~${end.getDate()}일`;
  }

  return `${startText} ~ ${end.getMonth() + 1}월 ${end.getDate()}일`;
}

export default function MonthlyScheduleItem({ schedule, isSelected = false, onClick }) {
  return (
    <button
      type="button"
      onClick={() => onClick?.(schedule)}
      aria-expanded={isSelected}
      className={[
        'flex h-[62px] w-full shrink-0 items-center justify-between gap-4 rounded-[5px] px-[16px] text-left transition md:h-[70px] md:px-[20px]',
        isSelected ? 'bg-[#454545]' : 'bg-[#f6f6f6] hover:bg-[#ededed]',
      ].join(' ')}
    >
      <span className="flex min-w-0 flex-col gap-[2px]">
        <span
          className={[
            'truncate text-[14px] leading-[1.6] tracking-[-0.28px]',
            isSelected ? 'text-white' : 'text-[#212121]',
          ].join(' ')}
        >
          {schedule.title}
        </span>
        <span className="truncate text-[12px] leading-[1.6] tracking-[-0.24px] text-[#919191]">
          {formatDateRange(schedule.startDate, schedule.endDate)}
        </span>
      </span>

      {/* 아래에 상세를 펼친다는 표시 (버튼 전체가 클릭 영역이라 아이콘은 장식) */}
      <Plus
        aria-hidden="true"
        strokeWidth={1.4}
        className={['size-6 shrink-0', isSelected ? 'text-white' : 'text-[#919191]'].join(' ')}
      />
    </button>
  );
}
