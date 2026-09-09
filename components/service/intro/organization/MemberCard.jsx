export default function MemberCard({ leader, members }) {
  return (
    <div className="flex w-max flex-col gap-y-[10px] border border-dashed border-[#919191] px-3 py-4 text-center md:px-7 md:py-5">
      {/* 팀장 */}
      <p className="text-[14px] font-semibold leading-[1.6] tracking-[-0.02em] text-[#212121] md:text-[16px]">
        {leader}
      </p>

      {/* 팀원 */}
      {members.map((member, idx) => (
        <p
          key={idx}
          className="text-[13px] font-semibold leading-[1.6] tracking-[-0.02em] text-[#919191] md:text-[14px]"
        >
          {member}
        </p>
      ))}
    </div>
  );
}
