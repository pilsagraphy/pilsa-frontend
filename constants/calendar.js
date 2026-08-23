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
