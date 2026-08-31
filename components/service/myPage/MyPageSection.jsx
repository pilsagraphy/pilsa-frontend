'use client';

import React, { useEffect } from 'react';

import MyPageIntro from './MyPageIntro';
import MyPageStats from './MyPageStats';
import MyPageBoard from './MyPageBoard';
import MyInfoCard from './MyInfoCard';
import MyActivityCard from './MyActivityCard';

import useMyPageStore from '@/stores/useMyPageStore';

// 마이페이지 본문 조립 (공통 레이아웃의 Header/Sidebar/Footer는 상위 layout에서 처리)
export default function MyPageSection() {
  // 요약 데이터는 여기서 '진입 시 한 번만' 부른다.
  // 자식(Stats/Intro/InfoCard/ActivityCard)은 스토어를 읽기만 한다.
  useEffect(() => {
    const store = useMyPageStore.getState();
    store.fetchSummary();
    return () => store.reset(); // 떠날 때 비워서 다음 사용자에게 이전 정보가 안 남게
  }, []);

  return (
    <section className="mx-auto flex w-full max-w-[1016px] flex-col gap-[30px] bg-white p-6 md:p-8">
      {/* 영역 1: 인사말(좌) + 활동 통계(우) 같은 행 */}
      <div className="flex flex-col gap-[20px] lg:flex-row lg:items-center lg:gap-[40px]">
        <div className="min-w-0 lg:flex-1">
          <MyPageIntro />
        </div>
        <div className="w-full lg:w-[480px] lg:shrink-0">
          <MyPageStats />
        </div>
      </div>

      {/* 영역 3: 좌(목록) + 우(카드) 2단 */}
      <div className="flex flex-col gap-[30px] lg:flex-row lg:items-start">
        {/* 좌측: 탭 + 목록 */}
        <div className="min-w-0 flex-1">
          <MyPageBoard />
        </div>

        {/* 우측: 내 정보 / 활동 요약 (상단=좌측 탭 아래 선, 하단=좌측 표 마지막 게시글 선에 맞춤) */}
        <aside className="flex w-full flex-col gap-[7px] lg:mt-[34px] lg:h-[472px] lg:w-[264px] lg:shrink-0">
          <MyInfoCard />
          <MyActivityCard />
        </aside>
      </div>
    </section>
  );
}
