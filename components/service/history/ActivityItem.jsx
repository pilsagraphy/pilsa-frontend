const ActivityItem = ({ text }) => (
  <div className="flex items-start gap-5">
    {/* 회색 점: div로 간단히 처리 */}
    <span className="mt-2.5 size-1.5 shrink-0 rounded-full bg-[#DEDEDE]" />
    <p className="whitespace-pre-wrap text-[16px] leading-[1.6] tracking-tight text-[#212121]">
      {text}
    </p>
  </div>
);

export default ActivityItem;
