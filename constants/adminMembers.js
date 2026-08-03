// 관리자 - 회원 목록 마크업용 상수
// API 연동 전까지 DUMMY_MEMBERS로 화면을 그린다.

// 권한 뱃지 라벨
export const MEMBER_ROLES = {
  GENERAL: '일반회원',
  ADMIN_LV1: '관리 Lv.1',
  ADMIN_LV2: '관리 Lv.2',
  ADMIN_LV3: '관리 Lv.3',
};

// 권한 · 재학상태 인라인 수정 select의 선택지
export const MEMBER_ROLE_OPTIONS = Object.values(MEMBER_ROLES);
export const ENROLLMENT_STATUSES = ['재학생', '동문회'];

// 정렬 선택지
// TODO: 실제 정렬 기준은 API 스펙 확정 후 디자인팀과 맞출 것
export const MEMBER_SORT_OPTIONS = [
  { value: 'latest', label: '최신순' },
  { value: 'oldest', label: '오래된순' },
];

// 디자인 시안의 10개 행 패턴. 권한과 정지 기간만 서로 다르다.
// suspendedPeriod가 null이면 목록에 '-'로 표시된다.
const MEMBER_PATTERN = [
  { role: MEMBER_ROLES.GENERAL, suspendedPeriod: '26.04.05 - 26.05.05' },
  { role: MEMBER_ROLES.GENERAL, suspendedPeriod: null },
  { role: MEMBER_ROLES.GENERAL, suspendedPeriod: null },
  { role: MEMBER_ROLES.ADMIN_LV3, suspendedPeriod: null },
  { role: MEMBER_ROLES.ADMIN_LV1, suspendedPeriod: null },
  { role: MEMBER_ROLES.GENERAL, suspendedPeriod: null },
  { role: MEMBER_ROLES.GENERAL, suspendedPeriod: null },
  { role: MEMBER_ROLES.ADMIN_LV2, suspendedPeriod: null },
  { role: MEMBER_ROLES.GENERAL, suspendedPeriod: null },
  { role: MEMBER_ROLES.GENERAL, suspendedPeriod: null },
];

// 검색·정렬 동작을 눈으로 확인할 수 있도록 회원마다 이름·ID를 다르게 준다.
// 검색은 loginId/name을 대상으로 하므로(예: 'kim', '김철수', 'younghee') 이 둘을 다양화한다.
const PROFILE_POOL = [
  { name: '김철수', login: 'chulsoo' },
  { name: '이영희', login: 'younghee' },
  { name: '박민수', login: 'minsu' },
  { name: '최지우', login: 'jiwoo' },
  { name: '정하늘', login: 'haneul' },
  { name: '강도윤', login: 'doyoon' },
  { name: '조서연', login: 'seoyeon' },
  { name: '윤지호', login: 'jiho' },
  { name: '장예린', login: 'yerin' },
  { name: '임재현', login: 'jaehyun' },
];

// 페이지네이션을 확인할 수 있도록 시안대로 5페이지 분량(10건씩 4페이지 + 7건)을 만든다.
const DUMMY_MEMBER_COUNT = 47;

// memberId가 클수록 최근 가입으로 본다. → 최신순은 내림차순, 오래된순은 오름차순.
export const DUMMY_MEMBERS = Array.from({ length: DUMMY_MEMBER_COUNT }, (_, index) => {
  const memberId = index + 1;
  const profile = PROFILE_POOL[index % PROFILE_POOL.length];
  const { role, suspendedPeriod } = MEMBER_PATTERN[index % MEMBER_PATTERN.length];
  const seq = String(memberId).padStart(2, '0');

  return {
    memberId,
    loginId: `${profile.login}${seq}`,
    name: profile.name,
    phone: `010-0000-${seq.padStart(4, '0')}`,
    studentNumber: `2026${String(memberId).padStart(6, '0')}`,
    email: `${profile.login}****@naver.com`,
    enrollmentStatus: ENROLLMENT_STATUSES[index % ENROLLMENT_STATUSES.length],
    role,
    postCount: (memberId * 3) % 47,
    commentCount: (memberId * 7) % 93,
    suspendedPeriod,
  };
});
