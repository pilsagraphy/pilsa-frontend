'use client';
import React from 'react';
import HomeHero from './HomeHero';
import MainBoardGroup from './MainBoardGroup';
import CalendarSection from '@/components/service/calendars/CalendarSection';
import { calendarMockResponse } from '@/mocks/calendarData';
import { DUMMY_MAIN_USER } from '@/mocks/top4Data';

// 합치는 곳
export default function MainSection() {
  return (
    <section className="flex flex-col items-start p-0 gap-[40px] w-[915px]">
      {/* 영역 1: 인사말 */}
      <HomeHero userData={DUMMY_MAIN_USER} />

      {/* 영역 2: 일정 달력 */}
      <CalendarSection response={calendarMockResponse} />

      {/* 영역 3: 게시판 리스트 */}
      <MainBoardGroup />
    </section>
  );
}
