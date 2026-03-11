export const BASE_PATH = '/';

export const ROUTES = {
  // 게이트
  GATE: BASE_PATH,

  // public 영역
  ABOUT: `${BASE_PATH}about`,
  ABOUT_INTRO: `${BASE_PATH}about/intro`,
  ABOUT_HISTORY: `${BASE_PATH}about/history`,
  ABOUT_LOGO: `${BASE_PATH}about/logo`,
  ABOUT_HONOR: `${BASE_PATH}about/honor`,
  ABOUT_LEADER: `${BASE_PATH}about/leader`,
  CALENDAR: `${BASE_PATH}calendar`,
  GALLERY: `${BASE_PATH}gallery`,

  // auth 영역
  LOGIN: `${BASE_PATH}login`,
  SIGNUP: `${BASE_PATH}signup`,
  LOGOUT: `${BASE_PATH}logout`,

  // students 영역
  STUDENTS_DASHBOARD: `${BASE_PATH}students`,
  NOTICES: `${BASE_PATH}students/notices`,
  NOTICE_DETAIL: (id) => `${BASE_PATH}students/notices/${encodeURIComponent(id)}`,
};

// 비로그인 접근 가능
export const PUBLIC_ROUTES = [
  ROUTES.ABOUT,
  ROUTES.ABOUT_INTRO,
  ROUTES.ABOUT_HISTORY,
  ROUTES.ABOUT_LOGO,
  ROUTES.ABOUT_HONOR,
  ROUTES.ABOUT_LEADER,
  ROUTES.CALENDAR,
  ROUTES.GALLERY,
  ROUTES.LOGIN,
  ROUTES.SIGNUP,
];

// ROLE : STUDENTS, ADMIN 접근 가능
export const PROTECTED_STUDENTS_ROUTES = [ROUTES.STUDENTS_DASHBOARD, ROUTES.NOTICES];

// 상세/하위 경로까지 커버하려면 prefix도 같이!
export const PROTECTED_STUDENTS_PREFIX = ['/students'];
