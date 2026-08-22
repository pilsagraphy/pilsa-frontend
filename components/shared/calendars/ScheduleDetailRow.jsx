'use client';

// 일정 상세의 '라벨 - 값' 한 줄.
// 일정 구분 · 날짜 / 시간이 같은 모양이라 이 줄을 공유한다.
// 라벨 폭을 고정해 두 줄의 값 시작 위치를 맞춘다.
export default function ScheduleDetailRow({ label, children }) {
  return (
    <div className="flex items-start text-[14px] leading-[1.6] tracking-[-0.32px] md:text-[16px]">
      <dt className="w-[72px] shrink-0 font-semibold text-[#212121] md:w-[82px]">{label}</dt>
      <dd className="min-w-0 flex-1 break-keep text-[#454545]">{children}</dd>
    </div>
  );
}
