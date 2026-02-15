import Image from "next/image";

export default function IntroOrgChart() {
  return (
    <div className="flex flex-col gap-5 w-full">
      <div className="text-[18px] font-medium leading-[1.6] tracking-[-0.02] text-[#919191]">
        조직도
      </div>
      <div>
        {/* 조직도 사진 */}
        <Image
          src="/images/intro_org_chart.png"
          alt="필사그래피 동아리 조직도"
          width={800}
          height={600}
          className="w-full max-w-[800px] h-auto"
        />
      </div>
    </div>
  );
}
