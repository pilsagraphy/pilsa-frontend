// 관리자 - 게시글 관리 상수
//
// 목록은 GET /api/admin/posts 응답을 쓴다 (더미 데이터 없음).
// 서버 응답: { postId, boardId, boardName, title, authorName,
//             commentCount, likeCount, viewCount, created, state }

import { ROUTES } from './routes';

// ── 게시글 상태 (state) ───────────────────────────────────────────────
// 서버가 주는 값을 그대로 쓰고 화면 라벨만 여기서 붙인다.
// 목록에는 normal · blind 만 내려온다 (deleted 는 제외). 상세에서는 deleted 도 볼 수 있다.
export const POST_STATES = {
  NORMAL: 'normal',
  BLIND: 'blind',
  DELETED: 'deleted',
};

export const POST_STATE_LABELS = {
  [POST_STATES.NORMAL]: '공개',
  [POST_STATES.BLIND]: '블라인드',
  [POST_STATES.DELETED]: '삭제',
};

// 프론트가 모르는 상태가 새로 생겨도 칸이 비지 않도록 받은 값을 그대로 보여준다.
export const getPostStateLabel = (state) => POST_STATE_LABELS[state] ?? state;

// ── 게시판 필터 ───────────────────────────────────────────────────────
export const BOARD_FILTER_ALL = 'all';

// 관리자 게시판 목록(GET /api/admin/boards) 응답으로 선택지를 만든다.
// API 는 이름이 아니라 boardId 로 걸러주므로 값도 boardId 를 쓴다.
// Radix Select 는 문자열만 다루므로 숫자를 문자열로 바꿔 담는다.
export const buildBoardFilterOptions = (boards) => [
  { value: BOARD_FILTER_ALL, label: '전체 게시판' },
  ...(Array.isArray(boards)
    ? boards.map((board) => ({
        value: String(board.boardId),
        label: board.boardName,
      }))
    : []),
];

// ── 이동 경로 ─────────────────────────────────────────────────────────
// 관리자 전용 게시글 상세. 상태와 상관없이 제목 링크는 모두 이곳으로 보낸다.
// 사용자 상세는 블라인드·삭제 글을 보여주지 않고 익명글의 실작성자도 가리므로,
// 조치를 판단해야 하는 관리자에게는 쓸 수 없다.
export const getAdminPostDetailHref = (postId) =>
  postId != null ? ROUTES.ADMIN_POST_DETAIL(postId) : null;

// 상세에서 '돌아가기'가 어디를 가리킬지.
// 게시글 관리에서 제목을 눌러 들어왔는지, 댓글 관리에서 원글을 눌러 들어왔는지에 따라
// 돌아갈 곳이 다르다. 주소에 실어 보내므로 새로고침·새 탭에서도 유지된다.
export const DETAIL_FROM_PARAM = 'from';
export const DETAIL_FROM_POSTS = 'posts';
export const DETAIL_FROM_COMMENTS = 'comments';

// ─────────────────────────────────────────────────────────────────────
// 아래는 신고 관리(constants/adminReports.js) 마크업이 아직 쓰는 값이다.
// 신고 관리 API 연동(브랜치 182)에서 서버 응답으로 대체되면 함께 지운다.
// ─────────────────────────────────────────────────────────────────────

// 게시판 필터 선택지 (이름 기준) — 신고 관리 마크업 전용
export const BOARD_NAMES = ['자유게시판', '공지사항', '정보게시판'];

export const BOARD_FILTER_OPTIONS = [
  { value: BOARD_FILTER_ALL, label: '전체 게시판' },
  ...BOARD_NAMES.map((name) => ({ value: name, label: name })),
];

// 게시판별 boardId 와 댓글 영역 유무.
// '상세 경로를 안다'와 '그 상세에 댓글이 있다'는 다른 이야기라서 둘 다 필요하고,
// 따로 두면 서로 어긋나므로 한 객체에 묶는다. (댓글 신고의 앵커 링크가 hasComments를 본다)
const BOARD_DETAIL = {
  공지사항: { boardId: 1, hasComments: false }, // 공지 상세에는 댓글 영역이 없다
  자유게시판: { boardId: 2, hasComments: true },
  정보게시판: { boardId: 3, hasComments: true },
};

export const getBoardIdByName = (boardName) => BOARD_DETAIL[boardName]?.boardId ?? null;

// 그 게시판 상세에 댓글 영역이 있는지. 모르는 게시판은 없는 것으로 본다.
export const boardHasComments = (boardName) => BOARD_DETAIL[boardName]?.hasComments ?? false;

// 사용자 게시판 상세 경로 (신고 관리의 대상 미리보기 링크가 쓴다)
export const getPostDetailHref = (boardId, postId) =>
  boardId != null && postId != null ? ROUTES.BOARD_POST(boardId, postId) : null;

// 신고 관리 더미의 '대상 회원' 정보.
// 게시글·댓글 관리는 서버가 주는 authorLoginId · authorStudentNo 를 쓰므로 더 쓰지 않는다.
// 신고 목록 API 에는 아직 그 두 필드가 없어(authorName 만 내려온다) 신고 관리 마크업이
// 이 목록을 쓰고 있다 → 신고 관리 API 연동(브랜치 182)에서 함께 정리된다.
export const MEMBER_POOL = [
  { loginId: 'ch400', studentId: '2026000001', name: '김철수' },
  { loginId: 'younghee', studentId: '2025000042', name: '이영희' },
  { loginId: 'minsu', studentId: '2024000117', name: '박민수' },
  { loginId: 'jiwoo', studentId: '2026000073', name: '최지우' },
  { loginId: 'haneul', studentId: '2023000205', name: '정하늘' },
  { loginId: 'doyoon', studentId: '2025000088', name: '강도윤' },
  { loginId: 'seoyeon', studentId: '2024000019', name: '조서연' },
  { loginId: 'jiho', studentId: '2026000134', name: '윤지호' },
  { loginId: 'yerin', studentId: '2022000061', name: '장예린' },
  { loginId: 'jaehyun', studentId: '2023000150', name: '임재현' },
];
