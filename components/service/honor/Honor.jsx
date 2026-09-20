"use client";

import { useCallback, useEffect, useState } from "react";
import HonorGrid from "./HonorGrid";
import DeveloperCredits from "./DeveloperCredits";
import AppLoading from "@/components/common/AppLoading";
import { getDonations } from "@/apis/donation";
import { getErrorMessage } from "@/apis/auth";

export default function Honor() {
  // 폐기된 /api/public/honor/ 를 부르다 401 을 맞고 있었다. 공개 API 는 GET /api/donations 다(비로그인 열람 가능).
  const [donors, setDonors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDonations = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getDonations();
      setDonors(Array.isArray(data) ? data : []);
    } catch (err) {
      // 예전엔 console.error 만 찍어서, 화면은 '후원자가 없음' 과 구별되지 않았다
      setError(getErrorMessage(err, "명예의 전당을 불러오지 못했습니다."));
      setDonors([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDonations();
  }, [fetchDonations]);

  const sortedDonors = [...donors].sort((a, b) => b.amount - a.amount);

  const totalCount = sortedDonors.length;

  // 후원자가 이 수 이하면 1등만 크게 세우지 않고 모두 같은 크기로 보여 준다.
  // 두세 명뿐인데 한 명만 크고 나머지가 작으면 줄 세우기처럼 보이고, 화면도 휑하다.
  const EQUAL_LAYOUT_MAX = 4;
  const showEqually = totalCount > 0 && totalCount <= EQUAL_LAYOUT_MAX;

  const firstRanker = sortedDonors.slice(0, 1);
  const topRankers = sortedDonors.slice(1, 4);
  const normalRankers = sortedDonors.slice(4);

  return (
    <div className="mx-auto flex w-full max-w-[1016px] flex-col gap-8 bg-white px-4 py-4 sm:px-6 sm:py-7 md:gap-[40px] md:p-10">
      {/* 타이틀 영역 */}
      <header className="flex flex-col gap-[8px] border-b-[1.5px] border-[#DEDEDE] pb-6 md:gap-[12px] md:pb-[40px]">
        <h2 className="font-['Pretendard',sans-serif] font-semibold text-[24px] leading-[1.5] tracking-[-0.48px] text-[#212121]">
          명예의 전당
        </h2>
        <p className="font-['Pretendard',sans-serif] font-normal text-[16px] leading-[1.6] tracking-[-0.32px] text-[#919191]">
          필사그래피 명예의 전당
        </p>
      </header>

      {loading && <AppLoading label="명예의 전당 불러오는 중" />}

      {!loading && error && (
        <div className="flex flex-col items-center gap-3 py-16">
          <p className="text-[14px] text-[#919191]">{error}</p>
          <button
            type="button"
            onClick={fetchDonations}
            className="text-[14px] text-[#919191] underline transition-colors hover:text-[#212121]"
          >
            다시 시도
          </button>
        </div>
      )}

      {!loading && !error && totalCount === 0 && (
        <p className="py-16 text-center text-[14px] text-[#919191]">
          아직 등록된 후원자가 없습니다.
        </p>
      )}

      {/* 후원자 — 아래 '홈페이지 개발자'와 같은 급의 제목을 단다 */}
      {!loading && !error && totalCount > 0 && (
        <div className="flex flex-col gap-[4px]">
          <h3 className="font-['Pretendard',sans-serif] text-[20px] font-semibold leading-[1.5] tracking-[-0.4px] text-[#212121] md:text-[22px]">
            후원자
          </h3>
          <p className="text-[14px] leading-[1.6] tracking-[-0.28px] text-[#919191]">
            이분들의 마음이 오늘의 필사그래피를 만들었습니다.
          </p>
        </div>
      )}

      {/* 후원자가 적으면 모두 같은 크기로, 많아지면 등수별 크기로 */}
      <section className="flex flex-col">
        {showEqually ? (
          <HonorGrid items={sortedDonors} rankType="equal" />
        ) : (
          <>
            {/* 1등 */}
            {totalCount >= 1 && <HonorGrid items={firstRanker} rankType="first" />}

            {/* 2~4등 */}
            {totalCount >= 2 && <HonorGrid items={topRankers} rankType="top" />}

            {/* 5등부터 */}
            {totalCount >= 5 && <HonorGrid items={normalRankers} rankType="normal" />}
          </>
        )}
      </section>

      {/* 홈페이지를 만든 사람들 — 후원자 아래 */}
      <DeveloperCredits />
    </div>
  );
}
