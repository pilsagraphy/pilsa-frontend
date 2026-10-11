export default function TeamNameCard({ title, teamType = "teams" }) {
  const styles = {
    // 글자도 토큰(text-inverse-fg)으로 — 흰색 고정이면 다크모드에서 바탕(bg-inverse)만 밝아져 회장 이름이 안 보였다 (테스터 제보 10/11)
    chairman: "bg-inverse text-inverse-fg",
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
