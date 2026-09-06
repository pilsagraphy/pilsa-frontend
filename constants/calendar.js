// 일정 달력 상수
// 실제 화면의 '일정 구분' 선택지는 GET /api/event/categories 로 받는다 (하드코딩 금지).
// SCHEDULE_CATEGORIES 는 목 데이터(mocks/calendarData.js)의 라벨 정의용이고,
// 여기서 파생된 DEFAULT_SCHEDULE_CATEGORY 만 실제 화면에서도 쓴다 (아래 참고).
export const SCHEDULE_CATEGORIES = {
  MT: 'MT',
  REGULAR_MEETING: '정기 모임',
  PRODUCTION_STUDY: '제작 스터디',
  FESTIVAL: '축제',
  ETC: '기타',
};

// 구분 값이 없는 일정은 '기타'로 본다.
// 상세(ScheduleDetailCategory)에서 null 을 대신 표시하고, 관리자 폼에서는
// 새 일정의 기본 선택값으로 쓴다 — 서버 목록에 이 이름이 있을 때만.
export const DEFAULT_SCHEDULE_CATEGORY = SCHEDULE_CATEGORIES.ETC;

// ─────────────────── 캘린더 구독 (iCalendar/ICS) ───────────────────
// 피드 주소는 다른 API 와 같은 백엔드 주소(NEXT_PUBLIC_BASE_URL)로 만든다.
// 프론트 오리진(window.location.origin)을 쓰면 로컬(:3000)에서는 백엔드(:8080)가 아니라
// Next 에 요청이 가서 404 가 난다. 배포처럼 /api 가 프록시된 환경에서는 둘이 같으니 문제없다.
//
// 이 주소는 구글·애플 캘린더 서버가 직접 읽어 가므로 **공개 인터넷에서 닿아야** 한다 —
// localhost 피드는 브라우저에선 열려도 구글이 가져오지 못해 로컬에서는 구독이 성립하지 않는다.
export const CALENDAR_FEED_PATH = '/api/event/calendar.ics';

const apiBase = () => {
  const base = process.env.NEXT_PUBLIC_BASE_URL;
  if (base) return base.replace(/\/$/, '');
  return typeof window === 'undefined' ? '' : window.location.origin;
};

export const getCalendarFeedUrl = () => `${apiBase()}${CALENDAR_FEED_PATH}`;

// 일정 1건짜리 ICS — 안드로이드는 URL 구독이 불가능해서 "이 일정만 담기"로 대신한다.
export const getEventIcsUrl = (eventId) => `${apiBase()}/api/event/${eventId}.ics`;
