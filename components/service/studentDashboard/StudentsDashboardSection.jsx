'use client';
import React from 'react';
import StudentsDashboardIntro from './StudentsDashboardIntro';
import StudentsDashboardGroup from './StudentsDashboardGroup';
import CalendarSection from '@/components/shared/calendars/CalendarSection';
import { calendarMockResponse } from '@/mocks/calendarData';

// 합치는 곳
export default function StudentsDashboardSection() {
  return (
    <section className="flex flex-col items-start p-0 gap-[40px] w-[915px]">
      {/* 영역 1: 인사말 */}
      <StudentsDashboardIntro />

      {/* 영역 2: 일정 달력 */}
      <CalendarSection response={calendarMockResponse} />

      {/* 영역 3: 게시판 리스트 */}
      <StudentsDashboardGroup />
    </section>
  );
}
