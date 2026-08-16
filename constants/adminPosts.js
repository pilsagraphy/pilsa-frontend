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

const AUTHOR_POOL = [
  'ch400',
  'younghee',
  'minsu',
  'jiwoo',
  'haneul',
  'doyoon',
  'seoyeon',
  'jiho',
  'yerin',
  'jaehyun',
];

// 페이지네이션을 확인할 수 있도록 시안대로 5페이지 분량(10건씩 4페이지 + 7건)을 만든다.
const DUMMY_POST_COUNT = 47;

// postId가 클수록 최근 글로 본다. → 목록은 postId 내림차순(최신순)으로 보여준다.
export const DUMMY_POSTS = Array.from({ length: DUMMY_POST_COUNT }, (_, index) => {
  const postId = index + 1;
  const { boardName, status } = POST_PATTERN[index % POST_PATTERN.length];

  return {
    postId,
    boardName,
    title: TITLE_POOL[index % TITLE_POOL.length],
    author: AUTHOR_POOL[index % AUTHOR_POOL.length],
    commentCount: (postId * 3) % 17,
    likeCount: (postId * 5) % 29,
    viewCount: (postId * 13) % 241,
    createdAt: `26.05.${String((index % 28) + 1).padStart(2, '0')}`,
    status,
  };
});
