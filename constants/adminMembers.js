// 관리자 - 회원 목록 마크업용 상수
// API 연동 전까지 DUMMY_MEMBERS로 화면을 그린다.

// 권한 뱃지 라벨
export const MEMBER_ROLES = {
  GENERAL: '일반회원',
  ADMIN_LV1: '관리 Lv.1',
  ADMIN_LV2: '관리 Lv.2',
  ADMIN_LV3: '관리 Lv.3',
};

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

// 페이지네이션을 확인할 수 있도록 시안대로 5페이지 분량(10건씩 4페이지 + 7건)을 만든다.
const DUMMY_MEMBER_COUNT = 47;

export const DUMMY_MEMBERS = Array.from({ length: DUMMY_MEMBER_COUNT }, (_, index) => {
  const { role, suspendedPeriod } = MEMBER_PATTERN[index % MEMBER_PATTERN.length];

  return {
    memberId: index + 1,
    loginId: 'CH400',
    name: '김철수',
    phone: '0000-0000',
    studentNumber: '2026000000',
    email: 'ch****@naver.com',
    enrollmentStatus: '재학생',
    role,
    postCount: 3,
    commentCount: 6,
    suspendedPeriod,
  };
});
