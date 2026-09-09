import TeamNameCard from "./TeamNameCard";
import MemberCard from "./MemberCard";

export default function ChairmanSection({ title, leader, members }) {
  return (
    <div className="relative">
      {/* 회장단 카드 */}
      <TeamNameCard title={title} teamType="chairman" />

      <div className="absolute left-full top-1/2 -translate-y-1/2 flex items-center min-w-[200px]">
        {/* 가로 연결선 */}
        <div className="flex-1 border-t border-dashed border-[#919191]" />
        {/* 멤버 카드 */}
        <MemberCard leader={leader} members={members} />
      </div>
    </div>
  );
}
