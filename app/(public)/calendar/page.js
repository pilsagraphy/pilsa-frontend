import CalendarSection from '@/components/service/calendars/CalendarSection';
import { calendarMockResponse } from '@/mocks/calendarData';

export default function CalendarPage() {
  return <CalendarSection response={calendarMockResponse} />;
}
