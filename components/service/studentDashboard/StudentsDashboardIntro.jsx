'use client';
import React, { useState, useEffect } from 'react';

const userData = {
  userName: '사용자',
};

const cheeringMessages = [
  '오늘, 무언가 고민하던 것이 있다면 꼭 시작하세요.',
  '작은 시작이 큰 변화를 만듭니다. 오늘을 응원해요!',
  '어제보다 더 나은 오늘이 되길 바랄게요.',
  '포기하지 않는 마음이 가장 중요합니다. 파이팅!',
  '필사 화이팅 ~~ S2',
];

export default function StudentsDashboardIntro() {
  const [randomMessage, setRandomMessage] = useState('');

  useEffect(() => {
    // 컴포넌트가 마운트될 때 상수로 정의한 리스트에서 랜덤하게 하나를 선택합니다.
    const randomIndex = Math.floor(Math.random() * cheeringMessages.length);
    setRandomMessage(cheeringMessages[randomIndex]);
  }, []);

  return (
    // 1. 껍데기 제거: p-8, max-width, mx-auto를 지워서 부모의 정렬을 따르게 합니다.
    <div className="flex w-full flex-col">
      {/* 2. 넓은 화면: 인사말 / 랜덤 응원 멘트 한 줄 · 좁은 화면: 멘트는 다음 줄 */}
      <div className="flex w-full flex-col gap-4 pb-[40px] lg:flex-row lg:items-end lg:justify-between lg:gap-8">
        {/* 왼쪽: 인사말 */}
        <div className="flex min-w-0 flex-col gap-[12px]">
          <h2 className="font-['Pretendard',sans-serif] font-semibold text-[24px] leading-[1.5] tracking-[-0.48px] text-[#212121]">
            {userData.userName}님, 안녕하세요! :) ✍️
          </h2>
          <p className="font-['Pretendard',sans-serif] font-normal text-[18px] leading-[1.6] tracking-[-0.32px] text-[#212121]">
            오늘도 좋은하루 보내세요 !
          </p>
        </div>

        {/* 랜덤 응원 멘트: 모바일 전체 너비 · lg 이상 우측 정렬 */}
        <p className="min-w-0 max-w-full break-words text-[14px] font-normal tracking-[-0.02em] text-[#B9B9B9] lg:max-w-[min(100%,28rem)] lg:shrink-0 lg:pb-[4px] lg:text-right">
          &quot;{randomMessage}&quot;
        </p>
      </div>

      {/* 3. 구분선 (필요시 살리고, 필요 없으면 제거하세요) */}
      <div className="w-full border-b-[1.5px] border-[#DEDEDE]" />
    </div>
  );
}
