'use client';
import React, { useState, useEffect } from 'react';
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
      {/* 1. 상단 배너
          TODO: 대시보드 배너 이미지가 확정되면 이 자리에 <img>(또는 next/image)로 교체 */}
      <div
        aria-hidden
        className="mb-[40px] h-[160px] w-full rounded-[4px] bg-[#DEDEDE] md:h-[200px]"
      />

      {/* 2. 넓은 화면: 인사말 / 이 주의 문장 한 줄 · 좁은 화면: 문장은 다음 줄 */}
      <div className="flex w-full flex-col gap-2 pb-[28px] lg:flex-row lg:items-end lg:justify-between lg:gap-8 lg:pb-[40px]">
        {/* 왼쪽: 인사말 */}
        <div className="flex min-w-0 flex-col gap-[6px]">
          <h2 className="text-[18px] font-semibold leading-[1.5] tracking-[-0.02em] text-[#212121] md:text-[20px]">
            {userName}님, 안녕하세요! :) ✍️
          </h2>
          {greetingSubText && (
            <p className="text-[14px] font-normal leading-[1.6] tracking-[-0.02em] text-[#212121] md:text-[15px]">
              {greetingSubText}
            </p>
          )}
        </div>

        {/* 이 주의 문장: 모바일 전체 너비 · lg 이상 인사말과 같은 줄에서 우측 정렬 */}
        {quote && (
          <p className="min-w-0 max-w-full break-words text-[13px] font-normal tracking-[-0.02em] text-[#B9B9B9] md:text-[14px] lg:pb-[4px] lg:text-right">
            &quot;{quote}&quot;
          </p>
        )}
      </div>
    </div>
  );
}
