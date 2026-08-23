'use client';

// 일정 폼의 '라벨 - 입력' 한 줄. 라벨 폭을 고정해 입력 시작 위치를 맞춘다. (시안 92px)
export function ScheduleFormRow({ label, htmlFor, children }) {
  return (
    <div className="flex flex-col gap-[6px] md:flex-row md:items-start md:gap-0">
      <label
        htmlFor={htmlFor}
        className="text-[14px] leading-[1.6] tracking-[-0.32px] text-[#919191] md:w-[92px] md:shrink-0 md:pt-[8px] md:text-[16px]"
      >
        {label}
      </label>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

export const FIELD_CLASS =
  'h-[40px] w-full rounded-[6px] border border-[#dedede] bg-white px-[16px] text-[14px] leading-[1.6] tracking-[-0.32px] text-[#212121] outline-none transition-colors placeholder:text-[#b9b9b9] focus:border-[#919191] md:text-[16px]';
