'use client';

import MonthlyScheduleItem from '@/components/shared/calendars/MonthlyScheduleItem';

export default function MonthlyScheduleList({
  schedules = [],
  selectedId = null,
  onSelect,
  isLoading = false,
}) {
  if (isLoading) {
    return (
      <div className="text-[16px] tracking-[-0.36px] text-[#919191] sm:text-[18px]">
        일정을 불러오는 중입니다.
      </div>
    );
  }

  if (!schedules || schedules.length === 0) {
    return (
      <div className="text-[16px] tracking-[-0.36px] text-[#919191] sm:text-[18px]">
        아직 일정이 존재하지 않아요.
      </div>
    );
  }

  return (
    <div className="w-full max-h-[min(45vh,240px)] overflow-y-auto sm:max-h-[min(52vh,320px)] lg:max-h-[380px]">
      <div className="flex flex-col gap-3 pr-[2px] sm:gap-[16px]">
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
