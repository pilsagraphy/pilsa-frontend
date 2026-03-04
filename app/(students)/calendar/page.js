import CalendarSection from '@/components/service/calendars/CalendarSection';
import { calendarMockResponse } from '@/mocks/calendarData';

export default function CalendarPage() {
  return (
    <section className="w-full">
      <div className="mx-auto w-full max-w-[1200px] px-6 py-10">
        <CalendarSection response={calendarMockResponse} />
      </div>
    </section>
  );
}
