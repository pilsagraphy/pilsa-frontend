'use client';
import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { format, isWithinInterval, parseISO, startOfDay } from 'date-fns';

import useMyPageStore from '@/stores/useMyPageStore';
import { getEventList } from '@/apis/event';
import { getCurrentQuote } from '@/apis/quote';

// 오늘 날짜가 일정 기간에 포함되는지
function includesToday(schedule, today) {
  return isWithinInterval(today, {
    start: startOfDay(parseISO(schedule.startDate)),
    end: startOfDay(parseISO(schedule.endDate)),
  });
}

export default function StudentsDashboardIntro() {
  // 이름은 마이페이지 요약(GET /api/user/mypage)에서 온다.
  // 로그인 응답에는 이름이 없어(useAuthStore 는 userId 만 담는다) 늘 '사용자'로 보였다 (2026-09-20).
  const summary = useMyPageStore((s) => s.summary);
  const fetchSummary = useMyPageStore((s) => s.fetchSummary);
  const userName = summary?.name || '회원';

  // 이 주의 문장. 오늘을 포함하는 문장이 없으면 null 이고, 그때는 줄 자체를 그리지 않는다
  const [quote, setQuote] = useState(null);
  // null이면 아직 모르거나 조회 실패 → 일정 줄을 그리지 않는다
  const [todayScheduleCount, setTodayScheduleCount] = useState(null);

  useEffect(() => {
    if (!summary) fetchSummary();
  }, [summary, fetchSummary]);

  useEffect(() => {
    let alive = true;
    getCurrentQuote().then((content) => {
      if (alive) setQuote(content);
    });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    const fetchTodaySchedules = async () => {
      try {
        const yearMonth = format(new Date(), 'yyyy-MM');
        const result = await getEventList(yearMonth, yearMonth);
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

  // 일정이 있을 때만 알려 준다 — 없는 날 '오늘은 일정이 없습니다' 는 알려 주는 게 없다
  const greetingSubText =
    todayScheduleCount > 0 ? `오늘 일정 ${todayScheduleCount}개가 있어요.` : '';

  return (
    <div className="flex w-full flex-col">
      {/* 1. 상단 배너.
             사진이 가로로 긴 띠(1608x320)라 object-cover 로 가운데를 잘라 쓴다 —
             폰에서는 높이를 줄여 첫 화면이 사진으로만 채워지지 않게 한다.
             priority: 첫 화면 맨 위라 늦게 뜨면 글이 한 번 밀려 내려간다 */}
      <div className="relative mb-5 h-[120px] w-full overflow-hidden rounded-[4px] bg-[#DEDEDE] md:mb-[40px] md:h-[200px]">
        <Image
          src="/images/main-banner.webp"
          alt=""
          fill
          priority
          sizes="(max-width: 768px) 100vw, 1200px"
          className="object-cover"
        />
      </div>

      {/* 2. 넓은 화면: 인사말 / 이 주의 문장 한 줄 · 좁은 화면: 문장은 다음 줄 */}
      <div className="flex w-full flex-col gap-2 lg:flex-row lg:items-end lg:justify-between lg:gap-8 lg:pb-[40px]">
        {/* 왼쪽: 인사말 */}
        <div className="flex min-w-0 flex-col gap-[6px]">
          <h2 className="text-[18px] font-semibold leading-[1.5] tracking-[-0.02em] text-[#212121] md:text-[20px]">
            {userName}님, 안녕하세요! :)
          </h2>
          {greetingSubText && (
            <p className="text-[14px] font-normal leading-[1.6] tracking-[-0.02em] text-[#212121] md:text-[15px]">
              {greetingSubText}
            </p>
          )}
        </div>

        {/* 이 주의 문장: 모바일 전체 너비 · lg 이상 인사말과 같은 줄에서 우측 정렬.
            문장만 덩그러니 두면 무엇인지 알기 어려워 안내 한 줄을 위에 붙인다 */}
        {quote && (
          <div className="flex min-w-0 flex-col gap-[2px] lg:pb-[4px] lg:text-right">
            <p className="text-[12px] font-medium tracking-[-0.02em] text-[#919191] md:text-[13px]">
              오늘도 이 주의 문장과 함께 좋은 하루 보내세요
            </p>
            <p className="max-w-full break-words text-[13px] font-normal tracking-[-0.02em] text-[#B9B9B9] md:text-[14px]">
              &quot;{quote}&quot;
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
