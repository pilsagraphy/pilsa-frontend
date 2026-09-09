import AdvisorSection from "./AdvisorSection";
import ChairmanSection from "./ChairmanSection";
import TeamSection from "./TeamSection";
import { advisors, chairman, teams } from "@/constants/organization";

export default function OrganizationChart() {
  const horizontalBarGap = Number(100 / (teams.length * 2)).toFixed(1);
  return (
    <div className="w-full md:overflow-x-auto">
      {/* md 미만은 가로 스크롤 없이 한 화면에 들어가게 — 최소폭을 풀고 카드·여백을 줄인다(각 카드 컴포넌트).
          팀 3개는 flex-1 로 폭을 나눠 가지므로 폰 폭(축소 배율 적용 ≈ 480px)에도 나란히 선다. */}
      <section className="relative mx-auto max-w-[1200px] px-1 py-6 md:min-w-[600px] md:px-10 md:py-8">
        {/* 고문 영역 (md 이상 좌측 상단 고정, 미만은 위에 흐름대로) */}
        <div className="mb-6 md:absolute md:left-10 md:top-5 md:mb-0">
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
              <div key={index} className="flex min-w-0 flex-1 flex-col items-center">
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
