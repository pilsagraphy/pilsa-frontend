'use client';
import React from 'react';
import StudentsDashboardIntro from './StudentsDashboardIntro';
import StudentsDashboardGroup from './StudentsDashboardGroup';
import CalendarSection from '@/components/shared/calendars/CalendarSection';

// 합치는 곳
export default function StudentsDashboardSection() {
  return (
    <section className="mx-auto flex w-full max-w-[1016px] flex-col bg-white p-8 gap-[51px]">
      {/* 영역 1: 인사말 */}
      <StudentsDashboardIntro />

      {/* 영역 2: 일정 달력 */}
      <CalendarSection />

      {/* 영역 3: 게시판 리스트 */}
      <StudentsDashboardGroup />
    </section>
  );
}
