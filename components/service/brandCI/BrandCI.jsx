import BrandCIHeader from "./BrandCIHeader";
import BrandCIContent from "./BrandCIContent";
export default function BrandCI() {
  return (
    // 동일한 규격 적용: mx-auto, max-w-[1016px], p-8
    <div className="mx-auto flex w-full max-w-[1016px] flex-col gap-8 bg-white px-4 py-4 sm:px-6 sm:py-7 md:gap-[40px] md:p-10">
      {/* 타이틀 영역: About 페이지의 헤더 스타일과 gap을 통일 */}
      <header className="flex flex-col gap-[8px] border-b-[1.5px] border-[#DEDEDE] pb-6 md:gap-[12px] md:pb-[40px]">
        <h2 className="font-semibold text-[24px] leading-[1.5] tracking-[-0.02em] text-[#212121]">
          브랜드 CI
        </h2>
        <p className="text-[16px] leading-[1.6] tracking-[-0.02em] text-[#919191]">
          필사그래피의 로고와 브랜드 컬러
        </p>
      </header>

      {/* 컨텐츠 영역: 헤더와의 간격을 gap-[51px]로 맞춤 */}
      <main className="mt-8 md:mt-[51px]">
        <BrandCIContent />
      </main>
    </div>
  );
}