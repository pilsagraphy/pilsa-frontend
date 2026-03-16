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
      {/* 2. 상단 텍스트와 랜덤 메시지를 한 줄로 배치 (justify-between) */}
      <div className="flex justify-between items-end w-full pb-[40px]">
        {/* 왼쪽: 인사말 */}
        <div className="flex flex-col gap-[12px]">
          <h2 className="font-['Pretendard',sans-serif] font-semibold text-[24px] leading-[1.5] tracking-[-0.48px] text-[#212121]">
            {userData.userName}님, 안녕하세요! :) ✍️
          </h2>
          <p className="font-['Pretendard',sans-serif] font-normal text-[18px] leading-[1.6] tracking-[-0.32px] text-[#212121]">
            오늘도 좋은하루 보내세요 !
          </p>
        </div>

        {/* 오른쪽: 랜덤 응원 멘트 (우측 정렬) */}
        <p className="text-[14px] font-normal tracking-[-0.02em] text-[#B9B9B9] pb-[4px]">
          "{randomMessage}"
        </p>
      </div>

      {/* 3. 구분선 (필요시 살리고, 필요 없으면 제거하세요) */}
      <div className="w-full border-b-[1.5px] border-[#DEDEDE]" />
    </div>
  );
}
