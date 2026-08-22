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

  // user 영역 (재학생·졸업생 공용)
  MY_PAGE: `${BASE_PATH}user/myPage`,

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
];

// 게시판 접근 가능 신분 (백엔드 users.member_type — STUDENT: 재학생 / ALUMNI: 졸업생)
// 관리자는 신분과 별개 축(adminLevel >= 1)이므로 접근 판정 시 함께 허용한다.
export const ALLOWED_BOARD_MEMBER_TYPES = ['STUDENT', 'ALUMNI'];

// 외부 도움말 사이트 (Google Play 정책·법적 고지 문서)
export const HELP_SITE_URL = 'https://help.pilsa.co.kr';

// 이용 제한 정책 — 이의 신청 절차가 적혀 있어 제재 안내 화면의 문의 경로로도 사용
export const SANCTION_POLICY_URL = `${HELP_SITE_URL}/sanction-policy.html`;
export const HELP_LINKS = [
  { label: '개인정보처리방침', href: `${HELP_SITE_URL}/privacy-policy.html` },
  { label: '이용 제한 정책', href: SANCTION_POLICY_URL },
  { label: '계정 삭제 안내', href: `${HELP_SITE_URL}/account-deletion.html` },
  { label: '아동 안전 표준', href: `${HELP_SITE_URL}/child-safety.html` },
];

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
