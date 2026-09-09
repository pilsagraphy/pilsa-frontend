import TeamNameCard from "./TeamNameCard";
import MemberCard from "./MemberCard";

export default function ChairmanSection({ title, leader, members }) {
  return (
    <div className="relative flex flex-col items-center md:block">
      {/* 회장단 카드 */}
      <TeamNameCard title={title} teamType="chairman" />

      {/* md 미만: 멤버 카드를 오른쪽에 붙이면 폰 폭을 넘어 가로 스크롤이 생긴다 → 아래로 내리고 세로 점선으로 잇는다 */}
      <div className="h-6 w-px border-l border-dashed border-[#919191] md:hidden" />
      <div className="flex items-center md:absolute md:left-full md:top-1/2 md:min-w-[200px] md:-translate-y-1/2">
        {/* 가로 연결선 (md 이상) */}
        <div className="hidden flex-1 border-t border-dashed border-[#919191] md:block" />
        {/* 멤버 카드 */}
        <MemberCard leader={leader} members={members} />
      </div>
    </div>
  );
}
