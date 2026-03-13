import CalendarSection from '@/components/shared/calendars/CalendarSection';
import { calendarMockResponse } from '@/mocks/calendarData';

export default function CalendarPage() {
  return <CalendarSection response={calendarMockResponse} />;
}
