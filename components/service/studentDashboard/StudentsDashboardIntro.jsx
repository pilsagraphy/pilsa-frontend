'use client';
import React, { useState, useEffect } from 'react';

const userData = {
  userName: '사용자',
  scheduleCount: 300,
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
    <div className="flex flex-col gap-[4px] w-full max-w-[915px]">
      {/* 영역 1: 사용자 이름 인사 */}
      <h1 className="text-[24px] font-medium tracking-[-0.02em] leading-[1.5] text-black h-[36px] flex items-center">
        {userData.userName}님, 안녕하세요! :) ✍️
      </h1>

      {/* 영역 2: 일정 및 랜덤 멘트 (중앙 정렬 레이아웃) */}
      <div className="flex flex-col gap-[4px] w-full">
        {/* 오늘 일정 개수 안내 */}
        <p className="text-[18px] font-normal tracking-[-0.02em] leading-[1.6] text-[#212121] h-[36px] flex items-center">
          오늘은 일정 {userData.scheduleCount}개가 있어요.
        </p>

        {/* 랜덤 응원 멘트 */}
        <p className="text-[14px] font-normal tracking-[-0.02em] leading-[1.6] text-[#B9B9B9] text-right">
          "{randomMessage}"
        </p>
      </div>
    </div>
  );
}
