'use client';
import React from 'react';
import StudentsDashboardIntro from './StudentsDashboardIntro';
import StudentsDashboardGroup from './StudentsDashboardGroup';
import CalendarSection from '@/components/shared/calendars/CalendarSection';

// 합치는 곳
export default function StudentsDashboardSection() {
  return (
    <section className="mx-auto flex w-full max-w-[1016px] flex-col gap-6 bg-white p-4 md:gap-[51px] md:p-8">
      {/* 영역 1: 인사말 */}
      <StudentsDashboardIntro />

      {/* 영역 2: 일정 달력 */}
      <CalendarSection />

      {/* 구분선: 디자인상 일정 달력과 게시판 리스트 사이 */}
      <div className="w-full border-b-[1.5px] border-[#DEDEDE]" />

      {/* 영역 3: 게시판 리스트 */}
      <StudentsDashboardGroup />
    </section>
  );
}
