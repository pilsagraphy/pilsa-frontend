// 무지 종이의 잉크 자국 — 카드 오른쪽 아래에 잉크 색으로 옅게. 번진 방울 하나와 튄 점 둘 (PM 10/10 밤 "무지는 잉크자국 있으면")
export default function InkBlot({ color, className = '' }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 100 100"
      className={`pointer-events-none absolute -bottom-2 -right-1 h-[64px] w-[64px] ${className}`}
      style={{ color, opacity: 0.14 }}
    >
      <path
        fill="currentColor"
        d="M62 22c9-6 22-3 27 7 4 8 0 15 6 22 6 8 4 20-5 26-9 7-19 5-28 10-10 6-22 4-29-5-6-8-3-17-9-24-7-8-5-21 4-27 8-5 16 0 24-3 4-2 6-4 10-6z"
      />
      <circle cx="18" cy="20" r="4" fill="currentColor" />
      <circle cx="30" cy="12" r="2.2" fill="currentColor" />
      <circle cx="88" cy="78" r="2.6" fill="currentColor" />
    </svg>
  );
}
