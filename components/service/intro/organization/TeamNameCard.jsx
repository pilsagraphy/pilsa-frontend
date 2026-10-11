export default function TeamNameCard({ title, teamType = "teams" }) {
  const styles = {
    chairman: "bg-inverse text-[#FFFFFF]",
    teams: "bg-line text-ink",
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
