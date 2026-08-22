'use client';

import { format, parseISO } from 'date-fns';
import { ko } from 'date-fns/locale';

import ScheduleDetailRow from '@/components/shared/calendars/ScheduleDetailRow';

// '2026-10-20' → '2026년 10월 20일 (화)'
function formatFullDate(value) {
  if (!value) return '';

  const date = parseISO(value);
  if (Number.isNaN(date.getTime())) return String(value);

  return format(date, 'yyyy년 MM월 dd일 (E)', { locale: ko });
}

// 시간(startTime · endTime)은 아직 API에 없어 있을 때만 덧붙인다.
function buildDateTimeText({ startDate, endDate, startTime, endTime }) {
  const start = formatFullDate(startDate);
  if (!start) return '';

  const isSingleDay = !endDate || endDate === startDate;

  // 하루짜리 일정은 날짜를 한 번만 적고 시간만 범위로 보여준다.
  if (isSingleDay) {
    if (startTime && endTime) return `${start} ${startTime} ~ ${endTime}`;
    if (startTime) return `${start} ${startTime}`;
    return start;
  }

  const startText = startTime ? `${start} ${startTime}` : start;
  const end = formatFullDate(endDate);
  const endText = endTime ? `${end} ${endTime}` : end;

  return `${startText} ~ ${endText}`;
}

// 일정 상세 - 날짜 / 시간
export default function ScheduleDetailDateTime({ startDate, endDate, startTime, endTime }) {
  const text = buildDateTimeText({ startDate, endDate, startTime, endTime });

  return <ScheduleDetailRow label="날짜 / 시간">{text || '-'}</ScheduleDetailRow>;
}
