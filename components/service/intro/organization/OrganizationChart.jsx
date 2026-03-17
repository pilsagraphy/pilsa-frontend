import AdvisorSection from "./AdvisorSection";
import ChairmanSection from "./ChairmanSection";
import TeamSection from "./TeamSection";
import { advisors, chairman, teams } from "@/constants/organization";

export default function OrganizationChart() {
  const horizontalBarGap = Number(100 / (teams.length * 2)).toFixed(1);
  return (
    <div className="w-full overflow-x-auto">
      <section className="relative min-w-[600px] max-w-[1200px] mx-auto py-8 px-10">
        {/* 고문 영역 (좌측 상단 고정) */}
        <div className="absolute left-10 top-5">
          <AdvisorSection advisors={advisors} />
        </div>

        {/* 메인 조직도 (중앙 정렬 축) */}
        <div className="flex flex-col items-center">
          {/* 회장단 */}
          <ChairmanSection
            title={chairman.title}
            leader={chairman.leader}
            members={chairman.members}
          />

          {/* T자형 중앙 세로선 */}
          <div className="w-px h-16 border-l border-dashed border-[#919191]"></div>

          {/* 하위 팀 레이아웃 (T자 가로선 + 팀 섹션) */}
          <div className="relative w-full flex justify-between">
            {/* T자 가로 막대 */}
            <div
              className={`absolute top-0 border-t border-dashed border-[#919191]`}
              style={{
                left: `${horizontalBarGap}%`,
                right: `${horizontalBarGap}%`,
              }}
            />

            {/* 하위 팀 섹션 */}
            {teams.map((team, index) => (
              <div key={index} className="flex flex-col items-center flex-1">
                {/* 세로선 */}
                <div className="w-px h-12 border-l border-dashed border-[#919191]" />
                <div>
                  <TeamSection
                    title={team.title}
                    leader={team.leader}
                    members={team.members}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
