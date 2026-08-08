'use client';

import MonthlyScheduleItem from '@/components/shared/calendars/MonthlyScheduleItem';

// 목록이 길어지면 오른쪽에 얇은 스크롤바가 생긴다. (디자인의 회색 막대)
const SCROLLBAR_CLASS = [
  '[&::-webkit-scrollbar]:w-[4px]',
  '[&::-webkit-scrollbar-track]:bg-transparent',
  '[&::-webkit-scrollbar-thumb]:rounded-full',
  '[&::-webkit-scrollbar-thumb]:bg-[#dedede]',
].join(' ');

export default function MonthlyScheduleList({
  schedules = [],
  selectedId = null,
  onSelect,
  isLoading = false,
}) {
  if (isLoading) {
    return (
      <div className="text-[14px] tracking-[-0.32px] text-[#919191] md:text-[16px]">
        일정을 불러오는 중입니다.
      </div>
    );
  }

  if (!schedules || schedules.length === 0) {
    return (
      <div className="text-[14px] tracking-[-0.32px] text-[#919191] md:text-[16px]">
        아직 일정이 존재하지 않아요.
      </div>
    );
  }

  return (
    <div
      className={`w-full max-h-[min(45vh,262px)] overflow-y-auto pr-[6px] sm:max-h-[min(52vh,344px)] lg:max-h-[450px] ${SCROLLBAR_CLASS}`}
    >
      <div className="flex flex-col gap-[12px]">
        {schedules.map((schedule) => (
          <MonthlyScheduleItem
            key={schedule.scheduleId}
            schedule={schedule}
            isSelected={selectedId === schedule.scheduleId}
            onClick={onSelect}
          />
        ))}
      </div>
    </div>
  );
}
