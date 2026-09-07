'use client';
import React from 'react';
import CalendarSection from '@/components/shared/calendars/CalendarSection';

// 일정 달력: 공용 CalendarSection 을 그대로 사용 (관리자 홈 전용 래퍼)
// 홈에서 상세를 숨기는 등 부모가 넘긴 설정은 그대로 전달한다.
export default function Schedule(props) {
  return <CalendarSection {...props} />;
}
