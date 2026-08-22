// 관리자 - 댓글 관리 마크업용 상수
// API 연동 전까지 DUMMY_COMMENTS로 화면을 그린다.

// 상태 라벨(공개 / 블라인드) · 게시판 필터 · 회원 정보는 게시글 관리와 같은 값을 쓰므로 가져온다.
import { MEMBER_POOL, POST_STATUSES } from './adminPosts';

export { BOARD_FILTER_ALL, BOARD_FILTER_OPTIONS, getPostDetailHref } from './adminPosts';

// 호출부에서 어색하지 않도록 댓글 쪽 이름으로도 내보낸다.
export const COMMENT_STATUSES = POST_STATUSES;

// 디자인 시안의 행 패턴. 게시판 · 상태만 서로 다르다.
const COMMENT_PATTERN = [
  { boardName: '자유게시판', status: COMMENT_STATUSES.PUBLIC },
  { boardName: '자유게시판', status: COMMENT_STATUSES.BLINDED },
  { boardName: '자유게시판', status: COMMENT_STATUSES.BLINDED },
  { boardName: '공지사항', status: COMMENT_STATUSES.PUBLIC },
  { boardName: '정보게시판', status: COMMENT_STATUSES.PUBLIC },
  { boardName: '자유게시판', status: COMMENT_STATUSES.PUBLIC },
  { boardName: '정보게시판', status: COMMENT_STATUSES.BLINDED },
  { boardName: '공지사항', status: COMMENT_STATUSES.PUBLIC },
  { boardName: '자유게시판', status: COMMENT_STATUSES.PUBLIC },
  { boardName: '정보게시판', status: COMMENT_STATUSES.PUBLIC },
];

// 검색(댓글 내용 · 글쓴이) 동작을 눈으로 확인할 수 있도록 댓글마다 내용·글쓴이를 다르게 준다.
// 시안의 '댓글내용들어갈부분공백미포함20자정도'에 맞춰 20자 안팎으로 둔다.
const CONTENT_POOL = [
  '저도 이번 엠티 진짜 재밌었어요 다음에 또 가요',
  '혹시 준비물 목록 어디서 확인할 수 있나요?',
  '사진 너무 잘 나왔네요 원본 좀 공유해 주세요',
  '이번 주 모임 시간이 변경된 건가요?',
  '좋은 정보 감사합니다 많은 도움이 됐어요',
  '저는 다른 펜 쓰는데 이게 더 부드럽더라고요',
  '신입인데 지금 신청해도 참여 가능할까요?',
  '동방 청소 저도 같이 도울게요 시간 알려주세요',
  '작품 정말 멋있어요 얼마나 연습하신 건가요',
  '방학 일정은 따로 공지 올라오나요?',
];

// 원글 링크에 마우스를 올렸을 때 보여줄 제목. 게시판별 상세 경로는 postId로 만든다.
const POST_TITLE_POOL = [
  '필사 엠티 넘 재밌어요!!',
  '이번 주 정기모임 후기 남깁니다',
  '신입 부원 모집 안내드립니다',
  '필사 도구 추천 좀 해주세요',
  '동아리방 청소 같이 하실 분',
];

// 페이지네이션을 확인할 수 있도록 시안대로 5페이지 분량(10건씩 4페이지 + 7건)을 만든다.
const DUMMY_COMMENT_COUNT = 47;

// commentId가 클수록 최근 댓글로 본다. → 목록은 commentId 내림차순(최신순)으로 보여준다.
export const DUMMY_COMMENTS = Array.from({ length: DUMMY_COMMENT_COUNT }, (_, index) => {
  const commentId = index + 1;
  const { boardName, status } = COMMENT_PATTERN[index % COMMENT_PATTERN.length];
  const member = MEMBER_POOL[index % MEMBER_POOL.length];

  return {
    commentId,
    boardName,
    // author는 목록 '글쓴이' 열용, 나머지 둘은 조치 모달의 '대상 회원'용
    author: member.loginId,
    authorStudentId: member.studentId,
    authorName: member.name,
    content: CONTENT_POOL[index % CONTENT_POOL.length],
    createdAt: `26.05.${String((index % 28) + 1).padStart(2, '0')}`,
    status,
    // 원글 정보 (원글 열의 링크)
    postId: ((commentId * 7) % 40) + 1,
    postTitle: POST_TITLE_POOL[index % POST_TITLE_POOL.length],
  };
});
