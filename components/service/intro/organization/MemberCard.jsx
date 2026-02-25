export default function MemberCard({ leader, members }) {
  return (
    <div className="border border-dashed border-[#919191] flex flex-col px-7 py-5 gap-y-[10px] w-max text-center">
      {/* 팀장 */}
      <p className="text-[16px] font-semibold leading-[1.6] tracking-[-0.02em] text-[#212121]">
        {leader}
      </p>

      {/* 팀원 */}
      {members.map((member, idx) => (
        <p
          key={idx}
          className="text-[14px] font-semibold leading-[1.6] tracking-[-0.02em] text-[#919191]"
        >
          {member}
        </p>
      ))}
    </div>
  );
}
