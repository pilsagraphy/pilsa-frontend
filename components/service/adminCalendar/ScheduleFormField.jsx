'use client';

// 일정 폼의 '라벨 - 입력' 한 줄. 라벨 폭을 고정해 입력 시작 위치를 맞춘다. (시안 92px)
// labelExtra: 폰에서 라벨 줄 오른쪽 끝에 붙는 요소 (예: 날짜/시간 줄의 '종일' 체크). PC 에서는 그리지 않는다
export function ScheduleFormRow({ label, htmlFor, children, labelExtra = null }) {
  return (
    <div className="flex flex-col gap-[6px] md:flex-row md:items-start md:gap-0">
      <div className="flex items-center justify-between md:block md:w-[92px] md:shrink-0">
        <label
          htmlFor={htmlFor}
          className="text-[14px] leading-[1.6] tracking-[-0.32px] text-[#919191] md:pt-[8px] md:text-[16px]"
        >
          {label}
        </label>
        {labelExtra && <div className="md:hidden">{labelExtra}</div>}
      </div>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

export const FIELD_CLASS =
  'h-[40px] w-full rounded-[6px] border border-[#dedede] bg-white px-[16px] text-[14px] leading-[1.6] tracking-[-0.32px] text-[#212121] outline-none transition-colors placeholder:text-[#b9b9b9] focus:border-[#919191] md:text-[16px]';
