export default function TeamNameCard({ title, teamType = "teams" }) {
  const styles = {
    chairman: "bg-[#212121] text-[#FFFFFF]",
    teams: "bg-[#DEDEDE] text-[#212121]",
  };

  return (
    <div
      className={`flex h-[60px] w-[104px] items-center justify-center rounded-full text-[15px] md:h-[78px] md:w-[138px] md:text-[20px]
        font-semibold leading-[1.6] tracking-[-0.02em] ${styles[teamType]}`}
    >
      {title}
    </div>
  );
}
