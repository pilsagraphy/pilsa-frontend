import OrganizationChart from "./organization/OrganizationChart";

export default function IntroOrgChart() {
  return (
    <div className="flex flex-col gap-5 w-full">
      <h3 className="text-[18px] font-semibold leading-[1.6] tracking-[-0.02em] text-[#212121]">
        조직도
      </h3>
      <div className="flex justify-start">
        {/* 조직도 차트 */}
        <OrganizationChart />
      </div>
    </div>
  );
}
