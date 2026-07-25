import BrandCIHeader from "./BrandCIHeader";
import BrandCIContent from "./BrandCIContent";
export default function BrandCI() {
  return (
    // 동일한 규격 적용: mx-auto, max-w-[1016px], p-8
    <div className="mx-auto flex w-full max-w-[1016px] flex-col bg-white p-8">
      {/* 타이틀 영역: About 페이지의 헤더 스타일과 gap을 통일 */}
      <header className="flex flex-col gap-[12px] pb-[40px] border-b-[1.5px] border-[#DEDEDE]">
        <h2 className="font-semibold text-[24px] leading-[1.5] tracking-[-0.02em] text-[#212121]">
          브랜드 CI
        </h2>
        <p className="text-[16px] leading-[1.6] tracking-[-0.02em] text-[#919191]">
          LOGO Design
        </p>
      </header>

      {/* 컨텐츠 영역: 헤더와의 간격을 gap-[51px]로 맞춤 */}
      <main className="mt-[51px]">
        <BrandCIContent />
      </main>
    </div>
  );
}