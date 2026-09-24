import { notFound } from 'next/navigation';

import CalendarSection from '@/components/shared/calendars/CalendarSection';
import { calendarTestMockResponse } from '@/mocks/calendarData';

// 일정 달력 확인용 페이지 (개발 환경 전용)
// 실제 API에는 여러 날 · 겹침 · 월 경계 일정이 없어서 화면에서 확인할 수가 없으므로,
// 목 데이터를 그대로 넣어 그려본다. 배포 환경에서는 404로 막는다.
// TODO: 리뷰 확인이 끝나면 이 페이지는 삭제할 것.
export default function CalendarMockPage() {
  if (process.env.NODE_ENV === 'production') notFound();

  return (
    <div className="flex flex-col gap-4">
      <p className="mx-auto w-full max-w-[915px] rounded-[4px] bg-[#f6f6f6] px-4 py-3 text-[14px] leading-[1.6] text-[#454545]">
        확인용 목 데이터 화면입니다. 실제 API를 호출하지 않습니다. (개발 환경에서만 열립니다)
      </p>

      <CalendarSection response={calendarTestMockResponse} />
    </div>
  );
}
