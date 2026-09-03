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
