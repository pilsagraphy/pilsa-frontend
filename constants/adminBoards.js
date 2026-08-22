// 관리자 - 게시판 관리 마크업용 상수
// API 연동 전까지 DUMMY_BOARDS로 화면을 그린다.

// 회원 권한 라벨(일반회원 / 관리 Lv.1~3)은 회원 관리와 같은 값을 쓰므로 가져온다.
import { MEMBER_ROLES } from './adminMembers';

export { MEMBER_ROLES };

// 열람 권한 라벨
export const BOARD_READ_ROLES = {
  STUDENT: '재학생',
  ALUMNI: '동문회',
};

// 작성 권한은 두 단계로만 고른다.
// '관리자'는 관리 Lv.1 · Lv.2 · Lv.3을 모두 포함하는 개념이다.
export const BOARD_WRITE_ROLES = {
  GENERAL: '일반회원',
  ADMIN: '관리자',
};

// 행 안에서 권한을 바꾸는 select의 선택지
export const BOARD_READ_ROLE_OPTIONS = Object.values(BOARD_READ_ROLES);
export const BOARD_WRITE_ROLE_OPTIONS = Object.values(BOARD_WRITE_ROLES);

// 저장된 권한(관리 Lv.N 포함) → select에 보여줄 두 단계 값
export const toWriteRoleGroup = (role) =>
  role === MEMBER_ROLES.GENERAL ? BOARD_WRITE_ROLES.GENERAL : BOARD_WRITE_ROLES.ADMIN;

// select에서 고른 두 단계 값 → 저장할 권한
// '관리자'를 골랐을 때 이미 관리 Lv.N이면 그 레벨을 유지하고, 아니면 Lv.1로 둔다.
export const fromWriteRoleGroup = (group, currentRole) => {
  if (group === BOARD_WRITE_ROLES.GENERAL) return MEMBER_ROLES.GENERAL;
  return currentRole && currentRole !== MEMBER_ROLES.GENERAL ? currentRole : MEMBER_ROLES.ADMIN_LV1;
};

// 게시판 목록 더미 데이터
// priority가 작을수록 위에 표시된다 (드래그로 순서 변경 시 이 값이 재정렬된다).
export const DUMMY_BOARDS = [
  {
    id: 1,
    boardName: '자유게시판',
    postCount: 3,
    readPermission: BOARD_READ_ROLES.STUDENT,
    writePermission: MEMBER_ROLES.GENERAL,
    priority: 1,
  },
  {
    id: 2,
    boardName: '공지사항',
    postCount: 5,
    readPermission: BOARD_READ_ROLES.STUDENT,
    writePermission: MEMBER_ROLES.ADMIN_LV1,
    priority: 2,
  },
  {
    id: 3,
    boardName: '필사 작품 공유',
    postCount: 12,
    readPermission: BOARD_READ_ROLES.STUDENT,
    writePermission: MEMBER_ROLES.GENERAL,
    priority: 3,
  },
  {
    id: 4,
    boardName: '정기모임 후기',
    postCount: 8,
    readPermission: BOARD_READ_ROLES.STUDENT,
    writePermission: MEMBER_ROLES.GENERAL,
    priority: 4,
  },
  {
    id: 5,
    boardName: '운영진 게시판',
    postCount: 6,
    readPermission: BOARD_READ_ROLES.STUDENT,
    writePermission: MEMBER_ROLES.ADMIN_LV2,
    priority: 5,
  },
  {
    id: 6,
    boardName: '동문회 게시판',
    postCount: 10,
    readPermission: BOARD_READ_ROLES.ALUMNI,
    writePermission: MEMBER_ROLES.GENERAL,
    priority: 6,
  },
];
