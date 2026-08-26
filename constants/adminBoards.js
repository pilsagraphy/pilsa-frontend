// 관리자 - 게시판 관리 상수
//
// 서버가 주는 값과 화면에 보여줄 한글 라벨을 잇는 곳이다.
// 서버 응답: { boardId, boardName, postCount, readScope, writeLevel, displayOrder }
// 목록은 GET /api/admin/boards 응답을 쓴다 (더미 데이터 없음).

// ── 열람 권한 (readScope) ─────────────────────────────────────────────
export const BOARD_READ_SCOPES = {
  MEMBER: 'MEMBER',
  STUDENT: 'STUDENT',
  ALUMNI: 'ALUMNI',
};

// 라벨은 시안 문구를 그대로 쓴다. API 명세의 설명(MEMBER=재학생+졸업생)과도 일치한다.
export const BOARD_READ_SCOPE_LABELS = {
  [BOARD_READ_SCOPES.MEMBER]: '전체',
  [BOARD_READ_SCOPES.STUDENT]: '재학생',
  [BOARD_READ_SCOPES.ALUMNI]: '졸업생',
};

// 서버에 프론트가 모르는 값이 새로 생겨도 칸이 비지 않도록 코드를 그대로 보여준다.
export const getReadScopeLabel = (scope) => BOARD_READ_SCOPE_LABELS[scope] ?? scope;

// select 선택지 - 서버로 보낼 값(value)과 보여줄 글자(label)가 다르다
export const BOARD_READ_SCOPE_OPTIONS = Object.entries(BOARD_READ_SCOPE_LABELS).map(
  ([value, label]) => ({ value, label })
);

// ── 작성 권한 (writeLevel) ────────────────────────────────────────────
// 서버는 0~3 숫자다. 시안의 네 단계와 1:1로 맞아서 그대로 보여준다.
export const GENERAL_WRITE_LEVEL = 0;

export const BOARD_WRITE_LEVEL_LABELS = {
  0: '일반회원',
  1: '관리 Lv.1',
  2: '관리 Lv.2',
  3: '관리 Lv.3',
};

// 프론트가 모르는 값이 와도 'Lv.undefined' 같은 글자가 표에 찍히지 않도록
// 열람 권한(getReadScopeLabel)과 같이 받은 값을 그대로 되돌린다.
export const getWriteLevelLabel = (writeLevel) =>
  BOARD_WRITE_LEVEL_LABELS[writeLevel] ?? writeLevel;

// Object.entries 의 키는 문자열이라 select 값으로 바로 쓸 수 있다.
export const BOARD_WRITE_LEVEL_OPTIONS = Object.entries(BOARD_WRITE_LEVEL_LABELS).map(
  ([value, label]) => ({ value, label })
);

// Radix Select 는 값으로 문자열만 받는다. 서버의 writeLevel(숫자)과 오갈 때 변환한다.
// 숫자를 그대로 넘기면 select 가 선택된 항목을 못 찾아 빈칸으로 보인다.
export const toWriteLevelValue = (writeLevel) => String(writeLevel ?? GENERAL_WRITE_LEVEL);
export const fromWriteLevelValue = (value) => Number(value);
