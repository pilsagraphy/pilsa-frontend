'use client';

import { useRef, useState } from 'react';
import { CalendarDays } from 'lucide-react';

import ScheduleDatePicker from '@/components/service/adminCalendar/ScheduleDatePicker';

// 날짜 한 칸. 누르면 일정 달력이 뜨고, 날짜를 고르면 바로 닫힌다 (한 번 클릭).
//
// 브라우저 기본 날짜 입력(type=date)은 폰·PC·브라우저마다 모양이 제각각이었고, 년·월·일 셀렉트 셋은 손이 많이 갔다.
// 이 주의 문장(시작일·종료일)과 일정 등록(시작·종료 + 시각)이 같은 칸을 쓴다.
//
// value / onChange 는 'YYYY-MM-DD' 문자열. min 을 주면 그보다 앞선 날은 골라도 min 으로 당긴다 (종료일 ≥ 시작일).
const toParts = (value) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(value ?? ''));
  if (m) return { year: m[1], month: m[2], day: m[3] };
  const d = new Date();
  return {
    year: String(d.getFullYear()),
    month: String(d.getMonth() + 1).padStart(2, '0'),
    day: String(d.getDate()).padStart(2, '0'),
  };
};
const fromParts = ({ year, month, day }) => `${year}-${month}-${day}`;

export default function DateField({
  value,
  onChange,
  min = null,
  placeholder = '날짜 선택',
  ariaLabel = '날짜 선택',
  className = '',
}) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef(null);

  const handleConfirm = (start) => {
    let next = fromParts(start);
    if (min && next < min) next = min;
    onChange?.(next);
    setOpen(false);
  };

  return (
    <div className={`relative ${className}`}>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-label={ariaLabel}
        aria-haspopup="dialog"
        aria-expanded={open}
        className="flex h-[44px] w-full items-center justify-between gap-[8px] rounded-[4px] border border-[#b9b9b9] bg-white px-3 text-left text-[15px] tracking-[-0.3px] text-[#212121] outline-none focus:border-[#212121]"
      >
        <span className={value ? '' : 'text-[#b9b9b9]'}>{value || placeholder}</span>
        <CalendarDays size={18} strokeWidth={1.6} className="shrink-0 text-[#757575]" aria-hidden />
      </button>

      {open && (
        <ScheduleDatePicker
          single
          start={toParts(value)}
          end={toParts(value)}
          triggerRef={triggerRef}
          onConfirm={handleConfirm}
          onClose={() => setOpen(false)}
        />
      )}
    </div>
  );
}
