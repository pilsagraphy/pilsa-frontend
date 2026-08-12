// 일정 달력 상수
// 일정 상세의 '일정 구분'에 쓰이는 라벨.
// TODO: API 연동 시 서버가 내려주는 코드 값과 매핑할 것. (스펙 확정 후 디자인팀과 맞추기)
export const SCHEDULE_CATEGORIES = {
  GENERAL: '일반 일정',
  REGULAR_MEETING: '정기모임',
};

export const SCHEDULE_CATEGORY_OPTIONS = Object.values(SCHEDULE_CATEGORIES);

// 구분 값이 없는 일정은 '일반 일정'으로 본다.
export const DEFAULT_SCHEDULE_CATEGORY = SCHEDULE_CATEGORIES.GENERAL;
