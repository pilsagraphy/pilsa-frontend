// 일정 달력 열의 최대 폭 — 회색선 두 줄이 폭·위치를 공유하는 단일 출처.
//
// - CALENDAR_COLUMN_MAX_W: 달력 · 월별 일정을 감싸는 열(CalendarSection)의 폭.
// - CALENDAR_DETAIL_MAX_W: 그 아래 일정 상세(ScheduleDetail)의 폭. 상세 위쪽 회색선('빨간박스')이 이 폭이다.
//
// 관리자 홈(AdminDashboardSection)의 인사말 회색선('초록박스')도 같은 두 상수를 그대로 거쳐,
// 어떤 화면 폭에서도 두 회색선의 가로 길이가 정확히 일치한다.
// 폭을 바꿀 일이 생기면 여기 한 곳만 고치면 모든 사용처가 함께 따라온다.
//
// (Tailwind는 이 문자열 리터럴을 그대로 스캔해 클래스를 생성하므로 임의값 표기를 유지한다.)
export const CALENDAR_COLUMN_MAX_W = 'max-w-[915px]';
export const CALENDAR_DETAIL_MAX_W = 'max-w-[785px]';
