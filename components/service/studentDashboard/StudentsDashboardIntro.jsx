'use client';
import React, { useState, useEffect } from 'react';
import { format, isWithinInterval, parseISO, startOfDay } from 'date-fns';

import useAuthStore from '@/stores/useAuthStore';
import { getScheduleList } from '@/apis/schedule';

const cheeringMessages = [
  '오늘, 무언가 고민하던 것이 있다면 꼭 시작하세요.',
  '작은 시작이 큰 변화를 만듭니다. 오늘을 응원해요!',
  '어제보다 더 나은 오늘이 되길 바랄게요.',
  '포기하지 않는 마음이 가장 중요합니다. 파이팅!',
  '필사 화이팅 ~~ S2',
];

// 오늘 날짜가 일정 기간에 포함되는지
function includesToday(schedule, today) {
  return isWithinInterval(today, {
    start: startOfDay(parseISO(schedule.startDate)),
    end: startOfDay(parseISO(schedule.endDate)),
  });
}

export default function StudentsDashboardIntro() {
  // 로그인 사용자 이름 (백엔드가 name을 내려주면 자동으로 반영된다)
  const userName = useAuthStore((state) => state.user?.name) ?? '사용자';

  const [randomMessage, setRandomMessage] = useState('');
  // null이면 아직 모르거나 조회 실패 → 기본 인사말을 보여준다
  const [todayScheduleCount, setTodayScheduleCount] = useState(null);

  useEffect(() => {
    // 컴포넌트가 마운트될 때 상수로 정의한 리스트에서 랜덤하게 하나를 선택합니다.
    const randomIndex = Math.floor(Math.random() * cheeringMessages.length);
    setRandomMessage(cheeringMessages[randomIndex]);
  }, []);

  useEffect(() => {
    let isMounted = true;

    const fetchTodaySchedules = async () => {
      try {
        const yearMonth = format(new Date(), 'yyyy-MM');
        const result = await getScheduleList(yearMonth, yearMonth);
        if (!isMounted) return;

        const today = startOfDay(new Date());
        const count = (result?.data ?? []).filter((schedule) =>
          includesToday(schedule, today)
        ).length;

        setTodayScheduleCount(count);
      } catch {
        // 조회 실패 시 개수 대신 기본 인사말을 보여준다
        if (isMounted) setTodayScheduleCount(null);
      }
    };

    fetchTodaySchedules();

    return () => {
      isMounted = false;
    };
  }, []);

  const greetingSubText =
    todayScheduleCount === null
      ? '오늘도 좋은 하루 보내세요 !'
      : todayScheduleCount > 0
        ? `오늘도 일정 ${todayScheduleCount}개가 있어요.`
        : '오늘은 일정이 없습니다.';

  return (
    <div className="flex w-full flex-col">
      {/* 1. 상단 배너
          TODO: 대시보드 배너 이미지가 확정되면 이 자리에 <img>(또는 next/image)로 교체 */}
      <div
        aria-hidden
        className="mb-[40px] h-[160px] w-full rounded-[4px] bg-[#DEDEDE] md:h-[200px]"
      />

      {/* 2. 넓은 화면: 인사말 / 랜덤 응원 멘트 한 줄 · 좁은 화면: 멘트는 다음 줄 */}
      <div className="flex w-full flex-col gap-4 pb-[40px] lg:flex-row lg:items-end lg:justify-between lg:gap-8">
        {/* 왼쪽: 인사말 */}
        <div className="flex min-w-0 flex-col gap-[12px]">
          <h2 className="font-['Pretendard',sans-serif] font-semibold text-[24px] leading-[1.5] tracking-[-0.48px] text-[#212121]">
            {userName}님, 안녕하세요! :) ✍️
          </h2>
          <p className="font-['Pretendard',sans-serif] font-normal text-[20px] leading-[1.6] tracking-[-0.32px] text-[#212121]">
            {greetingSubText}
          </p>
        </div>

        {/* 랜덤 응원 멘트: 모바일 전체 너비 · lg 이상 인사말과 같은 줄에서 우측 정렬
            폭 제한을 두지 않아 한 줄로 유지되고, 공간이 모자라면 인사말과 나눠 갖는다 */}
        <p className="min-w-0 max-w-full break-words text-[20px] font-normal tracking-[-0.02em] text-[#B9B9B9] lg:whitespace-nowrap lg:pb-[4px] lg:text-right">
          &quot;{randomMessage}&quot;
        </p>
      </div>
    </div>
  );
}
