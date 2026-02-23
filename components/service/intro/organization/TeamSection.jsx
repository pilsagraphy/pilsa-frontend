import TeamNameCard from "./TeamNameCard";
import MemberCard from "./MemberCard";

export default function TeamSection({ title, leader, members }) {
  return (
    <div className="flex flex-col gap-y-7 items-center">
      <TeamNameCard title={title} />
      <MemberCard leader={leader} members={members} />
    </div>
  );
}
