// 관리자 - 게시글 관리 마크업용 상수
// API 연동 전까지 DUMMY_POSTS로 화면을 그린다.

import { ROUTES } from './routes';

// 게시글 상태 라벨
export const POST_STATUSES = {
  PUBLIC: '공개',
  BLINDED: '블라인드',
};

// 게시판 필터 선택지
// TODO: API 연동 시 게시판 목록(관리자 - 게시판 관리)을 받아서 채울 것
export const BOARD_NAMES = ['자유게시판', '공지사항', '정보게시판'];

export const BOARD_FILTER_ALL = 'all';

export const BOARD_FILTER_OPTIONS = [
  { value: BOARD_FILTER_ALL, label: '전체 게시판' },
  ...BOARD_NAMES.map((name) => ({ value: name, label: name })),
];

// 목록에서 제목을 눌렀을 때 이동할 게시글 상세 경로
// TODO: API 연동 시 게시판 식별자(boardId)로 경로를 만들 것. 지금은 게시판 이름으로 잇는다.
const BOARD_DETAIL_ROUTES = {
  자유게시판: ROUTES.FREE_BOARD_DETAIL,
  공지사항: ROUTES.NOTICE_DETAIL,
  정보게시판: ROUTES.INFO_BOARD_DETAIL,
};

// 경로를 모르는 게시판이면 null을 돌려주고, 행에서는 링크 대신 텍스트로 보여준다.
export const getPostDetailHref = (boardName, postId) =>
  BOARD_DETAIL_ROUTES[boardName]?.(postId) ?? null;

// 디자인 시안의 행 패턴. 게시판 · 상태만 서로 다르다.
const POST_PATTERN = [
  { boardName: '자유게시판', status: POST_STATUSES.PUBLIC },
  { boardName: '자유게시판', status: POST_STATUSES.BLINDED },
  { boardName: '공지사항', status: POST_STATUSES.PUBLIC },
  { boardName: '정보게시판', status: POST_STATUSES.PUBLIC },
  { boardName: '자유게시판', status: POST_STATUSES.PUBLIC },
  { boardName: '정보게시판', status: POST_STATUSES.BLINDED },
  { boardName: '공지사항', status: POST_STATUSES.PUBLIC },
  { boardName: '자유게시판', status: POST_STATUSES.PUBLIC },
  { boardName: '정보게시판', status: POST_STATUSES.PUBLIC },
  { boardName: '자유게시판', status: POST_STATUSES.PUBLIC },
];

// 검색(제목 · 글쓴이) 동작을 눈으로 확인할 수 있도록 글마다 제목·글쓴이를 다르게 준다.
const TITLE_POOL = [
  '필사 엠티 넘 재밌어요!!',
  '이번 주 정기모임 후기 남깁니다',
  '신입 부원 모집 안내드립니다',
  '필사 도구 추천 좀 해주세요',
  '동아리방 청소 같이 하실 분',
  '작품 공유합니다 (첫 필사)',
  '시험 기간 스터디 모집',
  '지난 전시 사진 올려요',
  '펜 추천 질문 있습니다',
  '방학 중 활동 일정 문의',
];

// 글쓴이 정보. 목록의 '글쓴이' 열에는 loginId만 쓰지만,
// 조치 모달의 '대상 회원'은 로그인ID / 학번 / 이름을 함께 보여줘서 셋을 다 들고 있는다.
// 댓글 관리(adminComments.js)에서도 같은 회원을 쓰도록 여기서 내보낸다.
// TODO: API 연동 시 서버가 주는 작성자 정보로 대체할 것
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

// 페이지네이션을 확인할 수 있도록 시안대로 5페이지 분량(10건씩 4페이지 + 7건)을 만든다.
const DUMMY_POST_COUNT = 47;

// postId가 클수록 최근 글로 본다. → 목록은 postId 내림차순(최신순)으로 보여준다.
export const DUMMY_POSTS = Array.from({ length: DUMMY_POST_COUNT }, (_, index) => {
  const postId = index + 1;
  const { boardName, status } = POST_PATTERN[index % POST_PATTERN.length];
  const member = MEMBER_POOL[index % MEMBER_POOL.length];

  return {
    postId,
    boardName,
    title: TITLE_POOL[index % TITLE_POOL.length],
    // author는 목록 '글쓴이' 열용, 나머지 둘은 조치 모달의 '대상 회원'용
    author: member.loginId,
    authorStudentId: member.studentId,
    authorName: member.name,
    commentCount: (postId * 3) % 17,
    likeCount: (postId * 5) % 29,
    viewCount: (postId * 13) % 241,
    createdAt: `26.05.${String((index % 28) + 1).padStart(2, '0')}`,
    status,
  };
});
