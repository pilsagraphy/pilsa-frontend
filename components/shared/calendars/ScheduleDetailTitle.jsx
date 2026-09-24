'use client';

// 일정 상세 - 제목 (가운데 정렬)
export default function ScheduleDetailTitle({ title = '' }) {
  if (!title) return null;

  return (
    <h3 className="text-center text-[18px] font-semibold leading-[1.5] tracking-[-0.4px] text-[#212121] md:text-[20px]">
      {title}
    </h3>
  );
}
