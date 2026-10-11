export default function BrandColor() {
  return (
<div className="w-full max-w-[293px] border border-line-strong bg-surface-2 p-[5px]">
  {/* 위 로고 상자(293px)와 같은 폭. 견본은 정사각형 */}
  <div className="aspect-square w-full border border-line-strong bg-inverse" />
  <div className="p-[12px] flex flex-col gap-[4px]">
    <span className="text-[18px] font-medium">#212121</span>
    <span className="text-[14px] font-normal">흑연색</span>
  </div>
</div>
  );
}