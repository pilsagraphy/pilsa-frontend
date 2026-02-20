import HonorGrid from "./HonorGrid";

export default function Honor() {
  // 샘플 데이터 
  const donors = [
    {
      amount: 2000000,
      name: "박건희",
      org: "필사그래피",
      dept: "컴퓨터공학과",
      message: "필사 화이팅",
    },
    { amount: 1000000, name: "윤정민", org: "필사그래피", dept: "컴퓨터공학과" },
    { amount: 500000, name: "하종연", org: "필사그래피", dept: "컴퓨터공학과" },
    { amount: 300000, name: "신채원", org: "필사그래피", dept: "컴퓨터공학과" },
    { amount: 200000, name: "정주환", org: "필사그래피", dept: "컴퓨터공학과" },
    { amount: 100000, name: "문예빈", org: "필사그래피", dept: "컴퓨터공학과" },
    { amount: 50000, name: "김효림", org: "필사그래피", dept: "컴퓨터공학과" },
    { amount: 10000, name: "정도이", org: "필사그래피", dept: "컴퓨터공학과" },
    { amount: 10000, name: "한서은", org: "필사그래피", dept: "컴퓨터공학과" },
    { amount: 5000, name: "김수현", org: "필사그래피", dept: "컴퓨터공학과" },
    { amount: 5000, name: "이연서", org: "필사그래피", dept: "컴퓨터공학과" },
  ];
  
  const sortedDonors = [...donors].sort((a, b) => b.amount - a.amount);

  const totalCount = sortedDonors.length;

  const firstRanker = sortedDonors.slice(0, 1);
  const topRankers = sortedDonors.slice(1, 4);
  const normalRankers = sortedDonors.slice(4);

  return (
    <div className="mx-auto flex w-full max-w-[1016px] flex-col gap-[30px] bg-white p-8">
      {/* 타이틀 영역 */}
      <header className="flex flex-col gap-[12px] pb-[40px] border-b-[1.5px]">
        <h2 className="font-['Pretendard',sans-serif] font-semibold text-[24px] leading-[1.5] tracking-[-0.48px] text-[#212121]">
          명예의 전당
        </h2>
        <p className="font-['Pretendard',sans-serif] font-normal text-[16px] leading-[1.6] tracking-[-0.32px] text-[#919191]">
          필사그래피 명예의 전당
        </p>
      </header>

      {/* 등수별 그리드 영역 */}
      <section className="flex flex-col">
        {/* 1등 (데이터가 1개 이상일 경우 표시) */}
        {totalCount >= 1 && (
          <HonorGrid title="" items={firstRanker} rankType="first" />
        )}

        {/* 2-4등 (데이터가 2개 이상일 경우 표시) */}
        {totalCount >= 2 && (
          <HonorGrid
            title={totalCount === 2 ? "2등" : `2-${Math.min(totalCount, 4)}등`}
            items={topRankers}
            rankType="top"
          />
        )}

        {/* 5~n등 (데이터가 5개 이상일 경우 표시) */}
        {totalCount >= 5 && (
          <HonorGrid
            title={totalCount === 5 ? "5등" : `5-${totalCount}등`}
            items={normalRankers}
            rankType="normal"
          />
        )}
      </section>
    </div>
  );
}
