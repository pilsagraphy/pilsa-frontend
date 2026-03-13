'use client';

import MonthlyScheduleItem from '@/components/shared/calendars/MonthlyScheduleItem';

export default function MonthlyScheduleList({
  schedules = [],
  selectedId = null,
  onSelect,
  maxHeight = 380,
}) {
  if (!schedules || schedules.length === 0) {
    return (
      <div className="text-[18px] tracking-[-0.36px] text-[#919191]">
        아직 일정이 존재하지 않아요.
      </div>
    );
  }

  return (
    <div className="w-full overflow-y-auto" style={{ maxHeight }}>
      <div className="flex flex-col gap-[16px] pr-[2px]">
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
