// 무지 종이의 얼룩 — 컵 자국처럼 둥근 테두리가 진하고 안은 옅은 고리 하나, 반대편엔 물감 튄 자국 (PM 10/10 밤 참고 이미지).
// 잉크 색을 아주 옅게 써서 글씨를 방해하지 않는다. 모서리에 걸쳐 일부가 종이 밖으로 나간다
// strength: 얼룩 진하기 배수 (빈티지 종이는 2 쯤으로 진하게)
export default function InkBlot({ color, strength = 1 }) {
  return (
    <>
      {/* 컵 자국 — 오른쪽 위 */}
      <svg aria-hidden viewBox="0 0 120 120" className="pointer-events-none absolute -right-6 -top-5 h-[112px] w-[112px]" style={{ color, opacity: strength }}>
        <defs>
          <filter id="blotSoft" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="1.2" />
          </filter>
        </defs>
        <g filter="url(#blotSoft)" fill="none" stroke="currentColor" strokeLinecap="round">
          {/* 고리 — 두께가 들쭉날쭉하도록 살짝 어긋난 원 둘 */}
          <circle cx="60" cy="60" r="42" strokeWidth="5" opacity="0.16" />
          <circle cx="61.5" cy="58.5" r="41" strokeWidth="2.5" opacity="0.12" strokeDasharray="40 14 60 9 50 20" />
        </g>
        {/* 고리 안쪽은 옅게 번진 자국 */}
        <circle cx="60" cy="60" r="39" fill="currentColor" opacity="0.045" />
      </svg>

      {/* 물감 튄 자국 — 왼쪽 아래 */}
      <svg aria-hidden viewBox="0 0 100 100" className="pointer-events-none absolute -bottom-3 -left-3 h-[76px] w-[76px]" style={{ color, opacity: strength }}>
        <g fill="currentColor">
          <path
            opacity="0.17"
            d="M38 58c-6-9 2-20 12-19 8 1 10-8 18-6 9 2 7 12 13 16 8 6 2 18-7 19-7 1-9 8-17 7-9-1-8-9-14-11-4-2-4-4-5-6z"
          />
          <circle cx="24" cy="44" r="3.2" opacity="0.2" />
          <circle cx="30" cy="34" r="1.8" opacity="0.18" />
          <circle cx="78" cy="38" r="2.4" opacity="0.18" />
          <circle cx="70" cy="84" r="2" opacity="0.16" />
          <circle cx="52" cy="90" r="1.3" opacity="0.16" />
          <circle cx="16" cy="60" r="1.4" opacity="0.14" />
        </g>
      </svg>
    </>
  );
}
