// 일정 하나를 각자 캘린더에 담는 방법.
//
// 구독(캘린더 전체)과 달리 '이 일정 하나만' 넣는 길이다. 기기·브라우저마다 되는 방법이 달라 갈라야 한다.
//
//  - 아이폰·아이패드·맥 : 기본 캘린더가 .ics 파일을 직접 받아 '추가' 창을 띄운다.
//                        구글 캘린더 화면으로 보내면 사파리에서 로그인부터 요구해 대부분 중간에 포기한다.
//  - 안드로이드·PC      : .ics 는 '다운로드' 로 끝나 파일 앱에서 다시 열어야 한다.
//                        구글 캘린더의 일정 추가 화면(render?action=TEMPLATE)으로 보내는 편이 한 번에 끝난다.
//                        크롬·삼성 인터넷·엣지 모두 같은 주소를 연다.
//
// 어느 쪽이든 서버가 필요 없다 — .ics 는 이미 있는 공개 주소(/api/event/{eventId}.ics)이고,
// 구글 추가 화면은 쿼리로 내용을 넘기는 공개 페이지다.

import { isIOS } from '@/lib/platform';

// 'YYYY-MM-DD' + 'HH:mm' → 구글이 받는 'YYYYMMDDTHHmmSS'
const toGoogleDateTime = (date, time) =>
  `${String(date).replace(/-/g, '')}T${String(time).replace(':', '')}00`;

// 종일 일정의 끝은 배타적이라 하루를 더한다 (RFC 5545·구글 공통)
const nextDay = (date) => {
  const d = new Date(`${date}T00:00:00`);
  d.setDate(d.getDate() + 1);
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}`;
};

/**
 * 구글 캘린더 '일정 추가' 화면 주소.
 * 시각이 있으면 그 시각으로, 없으면 종일로 만든다. 시간대는 Asia/Seoul 로 못 박는다 —
 * 안 적으면 구글이 보는 사람의 기본 시간대로 읽어 해외에 있는 회원에게 시각이 어긋난다.
 */
export function googleCalendarUrl(schedule) {
  const { title, content, startDate, endDate, startTime, endTime } = schedule ?? {};

  const dates =
    startTime && endTime
      ? `${toGoogleDateTime(startDate, startTime)}/${toGoogleDateTime(endDate, endTime)}`
      : `${String(startDate).replace(/-/g, '')}/${nextDay(endDate || startDate)}`;

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title ?? '필사그래피 일정',
    dates,
    ctz: 'Asia/Seoul',
  });
  if (content) params.set('details', content);

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/** 일정 한 건짜리 .ics 주소 (서버가 만들어 준다). 캘린더 앱이 바로 받아 '추가' 창을 띄운다. */
export function icsUrl(eventId) {
  return `/api/event/${encodeURIComponent(eventId)}.ics`;
}

/** 이 기기에서 기본으로 권할 방법. 애플 기기는 캘린더 파일, 그 외는 구글 캘린더 화면. */
export function prefersIcs() {
  if (typeof navigator === 'undefined') return false;
  return isIOS() || /Macintosh/.test(navigator.userAgent);
}
