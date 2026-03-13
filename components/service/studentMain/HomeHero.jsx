'use client';
import React, { useState, useEffect } from 'react';

// top5Data에서 가져온 문구 중 하나를 랜덤으로 선택
// 근데 이거 백엔드에 없는 부분이라 어떻게 해야할지 ..

export default function HomeHero({ userData }) {
  const [randomMessage, setRandomMessage] = useState('');

  useEffect(() => {
    // 화면이 브라우저에 마운트된 후에만 랜덤 문구를 설정
    if (userData?.cheeringMessages?.length > 0) {
      const msgs = userData.cheeringMessages;
      const selected = msgs[Math.floor(Math.random() * msgs.length)];
      setRandomMessage(selected);
    }
  }, [userData]);

  if (!userData) return null;

  return (
    <div className="flex flex-col gap-[4px] w-full max-w-[915px]">
      {/* 영역 1: 사용자 이름 인사 (Heading/03 스타일) */}
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
