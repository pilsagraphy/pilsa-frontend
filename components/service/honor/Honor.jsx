"use client";

import { useEffect, useState } from "react";
import HonorGrid from "./HonorGrid";
import { getHonorList } from "@/apis/honor";

import { DUMMY_DONORS } from "@/mocks/donorsData";

export default function Honor() {  
  const [donors, setDonors] = useState([]);

  useEffect(() => {
    const fetchHonor = async () => {
      try {
        const data = await getHonorList();
        setDonors(data);
      } catch (error) {
        console.error("명예의 전당 조회 실패:", error);
      }
    };

    fetchHonor();
  }, []);
  
  const sortedDonors = [...donors].sort((a, b) => b.amount - a.amount);

  const totalCount = sortedDonors.length;

  const firstRanker = sortedDonors.slice(0, 1);
  const topRankers = sortedDonors.slice(1, 4);
  const normalRankers = sortedDonors.slice(4);

  return (
    <div className="mx-auto flex w-full max-w-[1016px] flex-col gap-[40px] bg-white p-8">
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
          <HonorGrid items={firstRanker} rankType="first" />
        )}

        {/* 2-4등 (데이터가 2개 이상일 경우 표시) */}
        {totalCount >= 2 && (
          <HonorGrid
            items={topRankers}
            rankType="top"
          />
        )}

        {/* 5~n등 (데이터가 5개 이상일 경우 표시) */}
        {totalCount >= 5 && (
          <HonorGrid
            items={normalRankers}
            rankType="normal"
          />
        )}
      </section>
    </div>
  );
}
