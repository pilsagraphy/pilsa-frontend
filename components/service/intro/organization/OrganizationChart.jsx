import AdvisorSection from "./AdvisorSection";
import ChairmanSection from "./ChairmanSection";
import TeamSection from "./TeamSection";
import TeamNameCard from "./TeamNameCard";
import MemberCard from "./MemberCard";
import { advisors, chairman, teams } from "@/constants/organization";

// md 미만 전용 한 줄: 왼쪽 팀 이름 · 점선 · 오른쪽 멤버 카드.
// PC 의 T 자 조직도를 폰 폭에 욱여넣으면 카드끼리 닿거나 가로 스크롤이 생겨서, 폰은 세로 목록으로 따로 그린다.
function MobileRow({ title, teamType, leader, members }) {
  return (
    <div className="flex items-center gap-3">
      <TeamNameCard title={title} teamType={teamType} />
      <div className="h-px min-w-[16px] flex-1 border-t border-dashed border-[#919191]" />
      <MemberCard leader={leader} members={members} />
    </div>
  );
}

export default function OrganizationChart() {
  const horizontalBarGap = Number(100 / (teams.length * 2)).toFixed(1);
  return (
    <>
      {/* ── 모바일 (md 미만): 세로 목록 ── */}
      <div className="flex flex-col gap-6 py-4 md:hidden">
        <AdvisorSection advisors={advisors} />

        <MobileRow
          title={chairman.title}
          teamType="chairman"
          leader={chairman.leader}
          members={chairman.members}
        />

        {teams.map((team, index) => (
          <MobileRow key={index} title={team.title} leader={team.leader} members={team.members} />
        ))}
      </div>

      {/* ── PC (md 이상): T 자 조직도 ── */}
      <div className="hidden w-full overflow-x-auto md:block">
        <section className="relative mx-auto min-w-[600px] max-w-[1200px] px-10 py-8">
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
    </>
  );
}
