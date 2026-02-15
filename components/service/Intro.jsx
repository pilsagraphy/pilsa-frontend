import IntroContent from "./IntroContent";
import IntroOrgChart from "./IntroOrgChart";
import { DUMMY_INTRO } from "@/constants/intro";

export default function Intro() {
  return (
    <div className="mx-auto flex w-full max-w-[1016px] flex-col gap-[51px] bg-white p-8">
      {/* 타이틀 영역 */}
      <div className="flex flex-col gap-[12px] pb-[40px] border-b-[1.5px]">
        <p className="font-['Pretendard',sans-serif] font-semibold text-[24px] leading-[1.5] tracking-[-0.48px] text-[#212121]">
          동아리 소개
        </p>
        <p className="font-['Pretendard',sans-serif] font-normal text-[16px] leading-[1.6] tracking-[-0.32px] text-[#919191]">
          필사그래피
        </p>
      </div>

      {/* 인트로 컨텐츠 영역 */}
      <div className="flex flex-col gap-[51px]">
        {DUMMY_INTRO.map((data, index) => (
          <IntroContent key={index} title={data.title} content={data.content} />
        ))}
      </div>

      {/* 조직도 영역 */}
      <div className="flex flex-col">
        <IntroOrgChart />
      </div>
    </div>
  );
}
