import IntroContent from "./IntroContent";
import IntroOrgChart from "./IntroOrgChart";
import { DUMMY_INTRO } from "@/constants/intro";

export default function Intro() {
  return (
    <div className="mx-auto flex w-full max-w-[1016px] flex-col gap-8 bg-white px-4 py-4 sm:px-6 sm:py-7 md:gap-[40px] md:p-10">
      {/* 타이틀 영역 */}
      <header className="flex flex-col gap-[8px] border-b-[1.5px] border-[#DEDEDE] pb-6 md:gap-[12px] md:pb-[40px]">
        <h2 className="font-['Pretendard',sans-serif] font-semibold text-[24px] leading-[1.5] tracking-[-0.02em] text-[#212121]">
          동아리 소개
        </h2>
        <p className="font-['Pretendard',sans-serif] text-[16px] leading-[1.6] tracking-[-0.02em] text-[#919191]">
          경희대학교 국제캠퍼스 필사 동아리, 필사그래피를 소개합니다
        </p>
      </header>

      {/* 인트로 컨텐츠 영역 */}
      <section className="flex flex-col gap-[51px]">
        {DUMMY_INTRO.map((data, index) => (
          <IntroContent key={index} title={data.title} content={data.content} />
        ))}
      </section>

      {/* 조직도 영역 */}
      <section className="flex flex-col">
        <IntroOrgChart />
      </section>
    </div>
  );
}
