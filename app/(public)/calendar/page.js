import CalendarSection from '@/components/shared/calendars/CalendarSection';

export default function CalendarPage() {
  // 다른 페이지(게시판·관리자 일정)와 같은 컨테이너 규격 — 이게 없어서 모바일에서 달력만 화면 끝에 붙어 있었다
  return (
    <div className="mx-auto flex w-full max-w-[1016px] flex-col bg-white px-4 py-4 sm:px-6 sm:py-7 md:p-10">
      <CalendarSection />
    </div>
  );
}
