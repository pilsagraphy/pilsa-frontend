// 일정 달력 상수
// 일정 상세의 '일정 구분' · 관리자 일정 폼의 드롭다운에 쓰이는 라벨.
// TODO: API 연동 시 서버가 내려주는 코드 값과 매핑할 것. (지금은 디자인 시안의 라벨 그대로)
export const SCHEDULE_CATEGORIES = {
  MT: 'MT',
  REGULAR_MEETING: '정기 모임',
  PRODUCTION_STUDY: '제작 스터디',
  FESTIVAL: '축제',
  ETC: '기타',
};

export const SCHEDULE_CATEGORY_OPTIONS = Object.values(SCHEDULE_CATEGORIES);

// 구분 값이 없는 일정은 '기타'로 본다.
export const DEFAULT_SCHEDULE_CATEGORY = SCHEDULE_CATEGORIES.ETC;

// ─────────────────── 캘린더 구독 (iCalendar/ICS) ───────────────────
// 백엔드가 같은 오리진(/api/**)에 붙어 있으므로 현재 오리진을 그대로 쓴다 — 환경별 주소를 따로 둘 필요가 없다.
export const CALENDAR_FEED_PATH = '/api/event/calendar.ics';

export const getCalendarFeedUrl = () =>
  typeof window === 'undefined' ? CALENDAR_FEED_PATH : window.location.origin + CALENDAR_FEED_PATH;

// 일정 1건짜리 ICS — 안드로이드는 URL 구독이 불가능해서 "이 일정만 담기"로 대신한다.
export const getEventIcsUrl = (eventId) =>
  `${typeof window === 'undefined' ? '' : window.location.origin}/api/event/${eventId}.ics`;
