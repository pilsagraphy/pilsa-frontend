'use client';

import { DEFAULT_SCHEDULE_CATEGORY } from '@/constants/calendar';
import ScheduleDetailRow from '@/components/shared/calendars/ScheduleDetailRow';

// 일정 상세 - 일정 구분
export default function ScheduleDetailCategory({ category }) {
  return (
    <ScheduleDetailRow label="일정 구분">{category || DEFAULT_SCHEDULE_CATEGORY}</ScheduleDetailRow>
  );
}
