"use client";

import { useCallback, useEffect, useState } from "react";
import HonorGrid from "./HonorGrid";
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
