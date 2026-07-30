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
  GUESTBOOK: `${BASE_PATH}guestbook`,

  // auth 영역
  LOGIN: `${BASE_PATH}login`,
  SIGNUP: `${BASE_PATH}signup`,
  LOGOUT: `${BASE_PATH}logout`,
  FIND_ID: `${BASE_PATH}findId`,
  FIND_EMAIL: `${BASE_PATH}findEmail`,
  FIND_PW: `${BASE_PATH}findPassword`,
  FIND_EMAIL: `${BASE_PATH}findEmail`,

  // students 영역
  STUDENTS_DASHBOARD: `${BASE_PATH}students`,
  NOTICES: `${BASE_PATH}students/notices`,
  NOTICE_DETAIL: (id) => `${BASE_PATH}students/notices/${encodeURIComponent(id)}`,
  NOTICE_WRITE: `${BASE_PATH}students/notices/write`,
  FREE_BOARD: `${BASE_PATH}students/free`,
  FREE_BOARD_DETAIL: (id) => `${BASE_PATH}students/free/${encodeURIComponent(id)}`,
  FREE_BOARD_WRITE: `${BASE_PATH}students/free/write`,
  INFO_BOARD: `${BASE_PATH}students/info`,
  INFO_BOARD_DETAIL: (id) => `${BASE_PATH}students/info/${encodeURIComponent(id)}`,
  INFO_BOARD_WRITE: `${BASE_PATH}students/info/write`,

  // admin 영역
  ADMIN_MEMBERS: `${BASE_PATH}admin/members`,
  ADMIN_BOARDS: `${BASE_PATH}admin/community/boards`,
  ADMIN_POSTS: `${BASE_PATH}admin/community/posts`,
  ADMIN_COMMENTS: `${BASE_PATH}admin/community/comments`,
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
  ROUTES.GUESTBOOK,
  ROUTES.LOGIN,
  ROUTES.SIGNUP,
  ROUTES.FIND_ID,
  ROUTES.FIND_EMAIL,
  ROUTES.FIND_PW,
  ROUTES.FIND_EMAIL,
];

// 게시판 접근 가능 역할 (ADMIN, ALUMNI, STUDENTS)
export const ALLOWED_BOARD_ROLES = ['ADMIN', 'ALUMNI', 'STUDENTS'];

// ROLE : STUDENTS, ADMIN 접근 가능
export const PROTECTED_STUDENTS_ROUTES = [
  ROUTES.STUDENTS_DASHBOARD,
  ROUTES.NOTICES,
  ROUTES.NOTICE_WRITE,
  ROUTES.FREE_BOARD,
  ROUTES.INFO_BOARD,
  ROUTES.FREE_BOARD_WRITE,
  ROUTES.INFO_BOARD_WRITE,
];

// 상세/하위 경로까지 커버하려면 prefix도 같이!
export const PROTECTED_STUDENTS_PREFIX = [
  '/students',
  '/students/notices',
  '/students/free',
  '/students/info',
];
