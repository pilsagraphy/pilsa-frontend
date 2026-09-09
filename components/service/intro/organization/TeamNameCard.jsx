export default function TeamNameCard({ title, teamType = "teams" }) {
  const styles = {
    chairman: "bg-[#212121] text-[#FFFFFF]",
    teams: "bg-[#DEDEDE] text-[#212121]",
  };

  return (
    <div
      className={`w-[138px] h-[78px] flex items-center justify-center rounded-full 
        text-[20px] font-semibold leading-[1.6] tracking-[-0.02em] ${styles[teamType]}`}
    >
      {title}
    </div>
  );
}
