export default function BrandColor() {
  return (
<div className="w-full max-w-[293px] border border-line-strong bg-surface-2 p-[5px]">
  {/* 위 로고 상자(293px)와 같은 폭. 견본은 정사각형.
      견본은 테마 토큰(bg-inverse)이 아니라 브랜드 색 그대로 — 토큰이면 다크모드에서 흰색으로 뒤집혀 '#212121' 이 흰 칸으로 보였다 (테스터 제보 10/11) */}
  <div className="aspect-square w-full border border-line-strong bg-[#212121]" />
  <div className="p-[12px] flex flex-col gap-[4px]">
    <span className="text-[18px] font-medium">#212121</span>
    <span className="text-[14px] font-normal">흑연색</span>
  </div>
</div>
  );
}