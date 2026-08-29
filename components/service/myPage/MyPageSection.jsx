'use client';

import React, { useEffect } from 'react';
import { toast } from 'sonner';

import MyPageIntro from './MyPageIntro';
import MyPageStats from './MyPageStats';
import MyPageBoard from './MyPageBoard';
import MyInfoCard from './MyInfoCard';
import MyActivityCard from './MyActivityCard';

// 구글 연동 콜백이 붙여 보내는 쿼리 → 사용자에게 보여줄 안내
// (백엔드가 처리 후 /user/myPage?google=... | ?calendar=... 로 302 로 돌려보낸다)
const GOOGLE_CALLBACK_MESSAGES = {
  google: {
    linked: { type: 'success', text: '구글 계정을 연결했어요' },
    // 고른 구글 계정이 이미 다른 회원에게 붙어 있는 경우 — 재시도해도 같은 결과라 안내가 달라야 한다
    already_linked: { type: 'error', text: '이미 다른 회원이 사용 중인 구글 계정이에요' },
    failed: { type: 'error', text: '구글 계정 연결에 실패했어요. 다시 시도해주세요.' },
  },
  calendar: {
    linked: {
      type: 'success',
      text: '구글 캘린더를 연동했어요. 다가오는 일정을 채우는 중이에요',
    },
    failed: { type: 'error', text: '구글 캘린더 연동에 실패했어요. 다시 시도해주세요.' },
    cancelled: { type: 'info', text: '구글 캘린더 연동을 취소했어요' },
  },
};

// 마이페이지 본문 조립 (공통 레이아웃의 Header/Sidebar/Footer는 상위 layout에서 처리)
export default function MyPageSection() {
  // 연동 콜백 결과 안내.
  // useSearchParams 대신 window.location 을 쓴다 — 이 값은 마운트 직후 한 번만 필요하고,
  // 훅을 쓰면 이 페이지 전체가 Suspense 경계를 요구하게 된다.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    for (const [key, results] of Object.entries(GOOGLE_CALLBACK_MESSAGES)) {
      const message = results[params.get(key)];
      if (!message) continue;

      toast[message.type](message.text);

      // 새로고침할 때마다 같은 토스트가 뜨지 않도록 쿼리를 지운다
      params.delete(key);
      const query = params.toString();
      window.history.replaceState({}, '', window.location.pathname + (query ? `?${query}` : ''));
      break;
    }
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
