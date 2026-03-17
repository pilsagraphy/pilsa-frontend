'use client';

function formatDateRange(startDate, endDate) {
  if (!startDate) return '';

  const start = startDate.replaceAll('-', '.');
  const end = endDate?.replaceAll('-', '.');

  if (!end || startDate === endDate) {
    return start;
  }

  return `${start} ~ ${end}`;
}

export default function MonthlyScheduleItem({ schedule, isSelected = false, onClick }) {
  return (
    <button
      type="button"
      onClick={() => onClick?.(schedule)}
      className={[
        'w-full text-left rounded-[4px] border border-[#919191] px-[20px] py-[18px] transition',
        isSelected ? 'bg-[#f6f6f6]' : 'bg-white hover:bg-[#f6f6f6]',
      ].join(' ')}
    >
      <div className="flex flex-col gap-[2px]">
        <p className="text-[18px] tracking-[-0.36px] text-[#212121] leading-[1.6]">
          {schedule.title}
        </p>
        <p className="text-[16px] tracking-[-0.32px] text-[#919191] leading-[1.6]">
          {formatDateRange(schedule.startDate, schedule.endDate)}
        </p>
      </div>
    </button>
  );
}
