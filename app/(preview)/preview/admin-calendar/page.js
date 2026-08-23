import { notFound } from 'next/navigation';

import AdminCalendarSection from '@/components/service/adminCalendar/AdminCalendarSection';
import { calendarTestMockResponse } from '@/mocks/calendarData';

// 관리자 일정 달력 확인용 페이지 (개발 환경 전용)
// 실제 화면은 /admin/calendar 이지만 관리자 로그인이 있어야 열려서 마크업 확인용으로만 둔다.
// TODO: 리뷰 확인이 끝나면 이 페이지는 삭제할 것.
export default function AdminCalendarPreviewPage() {
  if (process.env.NODE_ENV === 'production') notFound();

  return (
    <div className="flex flex-col gap-4">
      <p className="mx-auto w-full max-w-[1016px] rounded-[4px] bg-[#f6f6f6] px-4 py-3 text-[14px] leading-[1.6] text-[#454545]">
        관리자 일정 달력 확인용 목 데이터 화면입니다. (개발 환경에서만 열립니다)
      </p>

      <AdminCalendarSection response={calendarTestMockResponse} />
    </div>
  );
}
