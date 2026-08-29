// 관리자 - 신고 관리(게시글 신고 · 댓글 신고) 마크업용 상수
// API 연동 전까지 DUMMY_POST_REPORTS · DUMMY_COMMENT_REPORTS로 화면을 그린다.

import { getCommentAnchorId } from '@/lib/utils';
import { MEMBER_POOL, boardHasComments, getPostDetailHref } from './adminPosts';
import { REPORT_REASONS } from './report';

// 게시판 필터는 게시글 · 댓글 관리와 같은 목록을 쓴다.
export { BOARD_FILTER_ALL, BOARD_FILTER_OPTIONS } from './adminPosts';

// ── 탭 ────────────────────────────────────────────────────────────────
// 두 탭의 표 구조(열 구성)가 완전히 같고 대상 종류만 다르다.
export const REPORT_TARGET_POST = 'post';
export const REPORT_TARGET_COMMENT = 'comment';

export const REPORT_TABS = [
  { value: REPORT_TARGET_POST, label: '게시글 신고' },
  { value: REPORT_TARGET_COMMENT, label: '댓글 신고' },
];

// 모달 제목 · 표 안내문에 함께 쓰는 대상 종류 이름
export const REPORT_TARGET_LABELS = {
  [REPORT_TARGET_POST]: '게시글',
  [REPORT_TARGET_COMMENT]: '댓글',
};

// 탭과 그 내용(목록)을 aria-controls · aria-labelledby로 잇기 위한 DOM id.
// 탭을 그리는 쪽(ReportTabs)과 내용을 그리는 쪽(ReportListSection)이 같은 규칙을 써야 한다.
export const getReportTabId = (targetType) => `report-tab-${targetType}`;
export const getReportPanelId = (targetType) => `report-panel-${targetType}`;

// ── 상태 ──────────────────────────────────────────────────────────────
// 신고가 접수되면 곧바로 블라인드 상태가 되고, 관리자가 삭제하면 삭제(소프트 딜리트)로 바뀐다.
// 복원하면 원래 상태로 돌아가 더 조치할 것이 없으므로 목록에서 사라진다.
export const REPORT_STATUSES = {
  BLINDED: '블라인드',
  DELETED: '삭제',
};

export const STATUS_FILTER_ALL = 'all';

export const STATUS_FILTER_OPTIONS = [
  { value: STATUS_FILTER_ALL, label: '상태 전체' },
  { value: REPORT_STATUSES.BLINDED, label: REPORT_STATUSES.BLINDED },
  { value: REPORT_STATUSES.DELETED, label: REPORT_STATUSES.DELETED },
];

// 관리자가 취할 수 있는 조치
export const REPORT_ACTION_RESTORE = 'restore';
export const REPORT_ACTION_DELETE = 'delete';

// 목록의 관리 열 버튼 · 선택 액션 버튼 · 처리 모달 · 안내 문구에 모두 같은 이름을 쓴다.
// (시안 일부에 '반려'로 적힌 것이 있으나 '복원'으로 통일하기로 했다)
export const REPORT_ACTION_LABELS = {
  [REPORT_ACTION_RESTORE]: '복원',
  [REPORT_ACTION_DELETE]: '삭제',
};

// ── 표시 형식 ─────────────────────────────────────────────────────────
// 목록 '대상 미리보기' 열에 보여줄 최대 글자 수 (디자인: 본문 15자)
export const PREVIEW_MAX_LENGTH = 15;

// 이모지처럼 서로게이트 페어로 저장되는 문자도 한 글자로 세도록 배열로 풀어서 자른다.
// (ZWJ로 이어붙인 이모지는 여전히 여러 자로 세지만 본문 앞머리에는 거의 쓰이지 않아 그냥 둔다)
export const truncatePreview = (text, maxLength = PREVIEW_MAX_LENGTH) => {
  const characters = [...(text ?? '')];
  if (characters.length <= maxLength) return characters.join('');
  return `${characters.slice(0, maxLength).join('')}...`;
};

const REASON_LABEL_BY_CODE = Object.fromEntries(
  REPORT_REASONS.map(({ code, label }) => [code, label])
);

// 서버에 프론트가 모르는 사유 코드가 새로 생겨도 칸이 비지 않도록 코드를 그대로 보여준다.
export const getReportReasonLabel = (code) => REASON_LABEL_BY_CODE[code] ?? code;

// 복원은 어떤 상태에서도 할 수 있다 - 블라인드는 해제하고, 삭제는 되살린다.
// PATCH /api/admin/reports/select-restore가 '복원 = 모든 조치의 되돌리기'로, 삭제된 대상도
// 되살리고 부과됐던 주의 포인트까지 회수한다. 그래서 복원을 막는 술어는 두지 않는다.
// 이미 공개 상태라 되돌릴 것이 없는 경우는 서버가 failures로 걸러 알려준다.

// 이미 삭제된 것을 다시 삭제하는 것은 아무 일도 하지 않는 조치다.
export const isDeletable = (report) => report.status !== REPORT_STATUSES.DELETED;

// 대상 미리보기 링크.
// 게시글이면 그 글로, 댓글이면 댓글이 달린 원글 + 댓글 앵커(#comment-{id})로 이동한다.
// 댓글은 별도 상세 페이지가 없어서 해시로만 특정할 수 있다.
// 갈 곳이 없으면 null → 행에서는 링크 대신 텍스트로 보여준다.
export const getReportTargetHref = (report) => {
  const postHref = getPostDetailHref(report.boardName, report.postId);
  if (!postHref) return null;

  if (report.targetType !== REPORT_TARGET_COMMENT) return postHref;

  // 댓글 앵커는 그 게시판 상세에 댓글 영역이 있어야 의미가 있다.
  // 없는데도 원글로 보내면 '이동은 했는데 문제의 댓글이 없는' 화면이 되므로
  // 아예 링크를 걸지 않는다.
  if (!boardHasComments(report.boardName)) return null;

  return `${postHref}#${getCommentAnchorId(report.targetId)}`;
};

// ── 더미 데이터 ───────────────────────────────────────────────────────
// 시안의 상태 배치를 따라간다 (블라인드와 삭제가 섞여 있다).
const STATUS_PATTERN = [
  REPORT_STATUSES.BLINDED,
  REPORT_STATUSES.DELETED,
  REPORT_STATUSES.DELETED,
  REPORT_STATUSES.BLINDED,
  REPORT_STATUSES.DELETED,
  REPORT_STATUSES.DELETED,
  REPORT_STATUSES.BLINDED,
  REPORT_STATUSES.DELETED,
  REPORT_STATUSES.BLINDED,
  REPORT_STATUSES.DELETED,
];

const BOARD_PATTERN = ['자유게시판', '자유게시판', '정보게시판', '공지사항', '자유게시판'];

// 댓글 신고는 댓글 영역이 있는 게시판에서만 생길 수 있다.
// (공지 상세에는 댓글이 없어 '공지사항 댓글 신고'는 실제로 존재할 수 없다)
// 게시판이 늘어도 따라오도록 게시판 목록에서 걸러 만든다.
const COMMENT_BOARD_PATTERN = BOARD_PATTERN.filter((boardName) => boardHasComments(boardName));

// 게시글 신고용 글감.
// 목록의 '대상 미리보기'는 본문을, 모달의 '신고 상세'는 제목을 보여준다(시안 기준).
// 두 값을 따로 뽑으면 같은 신고인데 본문과 제목이 딴 이야기가 되어 데이터 오류로 보인다.
// 그래서 제목과 본문을 한 쌍으로 묶어 둔다.
const POST_CONTENT_POOL = [
  { title: '지금 바로 신청하세요 (광고)', body: '광고성 글 본문 내용입니다 지금 바로 문의 주세요' },
  { title: '한정 수량 특가 안내', body: '초특가 할인 이벤트 진행 중이니 서둘러 신청하세요' },
  { title: '이거 사실인가요?', body: '근거 없는 소문을 사실처럼 적어둔 본문입니다' },
  { title: '지난 행사 사진 모음', body: '다른 사람 사진을 허락 없이 올린 본문입니다' },
  { title: '외부 스터디 모집합니다', body: '동아리와 상관없는 외부 홍보 글 본문입니다' },
  { title: '공지 확인 부탁드립니다', body: '같은 내용을 여러 번 반복해서 올린 도배 글입니다' },
  { title: '어제 모임 후기 남깁니다', body: '남을 비방하는 표현이 섞여 있는 본문입니다' },
  { title: '좋은 글 공유합니다', body: '출처를 밝히지 않고 남의 글을 그대로 옮겼습니다' },
];

// 댓글 신고 - 미리보기 · 모달에 함께 쓰는 댓글 내용
const COMMENT_CONTENT_POOL = [
  '광고성 댓글 내용입니다 링크 눌러보세요',
  '여기 말고 다른 곳이 더 저렴해요 문의하세요',
  '그건 사실이 아닌데 왜 그렇게 말하시나요',
  '개인정보를 그대로 적어둔 댓글입니다',
  '같은 댓글을 계속 반복해서 남기고 있습니다',
  '글 주제와 전혀 상관없는 댓글입니다',
  '작성자를 비난하는 표현이 담긴 댓글입니다',
  '출처 없이 다른 글을 복사한 댓글입니다',
];

// 신고자 정보는 공개하지 않으므로 익명 별칭으로만 보여준다.
// (constants/report.js의 '신고자 정보는 공개되지 않습니다'와 같은 원칙)
const REPORTER_ALIASES = ['익명A', '익명B', '익명C'];

// 신고자가 남긴 상세 사유
const REPORT_DETAIL_POOL = [
  '근거 없는 정보',
  '사실이 아닌 주장',
  '무단 사진 촬영',
  '같은 글 반복 게시',
  '외부 링크 홍보',
  '연락처가 그대로 노출됨',
];

const REASON_CODES = REPORT_REASONS.map(({ code }) => code);

// 시각은 '00:00' 형태로만 쓰므로 분까지만 흉내낸다.
const REPORT_TIMES = ['14:00', '15:30', '16:45'];

// 신고 1건당 접수 내역 1~3개. 디자인처럼 익명A부터 순서대로 붙인다.
const buildReportLog = (seed, date) =>
  Array.from({ length: (seed % 3) + 1 }, (_, i) => ({
    reporterAlias: REPORTER_ALIASES[i],
    reasonCode: REASON_CODES[(seed + i) % REASON_CODES.length],
    detail: REPORT_DETAIL_POOL[(seed + i) % REPORT_DETAIL_POOL.length],
    reportedAt: `${date} ${REPORT_TIMES[i]}`,
  }));

// 페이지네이션을 확인할 수 있도록 시안대로 5페이지 분량(10건씩 4페이지 + 7건)을 만든다.
const DUMMY_REPORT_COUNT = 47;

// 목록은 reportId 내림차순(최신순)으로 정렬한다. 날짜가 reportId 순서와 어긋나면
// 화면에서는 최신순인데 '최초 신고일시'가 거꾸로 올라가 정렬이 깨진 것처럼 보인다.
// 그래서 가장 큰 reportId를 기준일로 두고 하루씩 거슬러 올라가 날짜를 만든다.
// (new Date()를 쓰지 않아 언제 실행해도 같은 값이 나온다)
const NEWEST_REPORT_DATE_UTC = Date.UTC(2026, 4, 19); // 2026-05-19
const MS_PER_DAY = 24 * 60 * 60 * 1000;

const formatDummyDate = (reportId) => {
  const daysAgo = DUMMY_REPORT_COUNT - reportId; // 가장 큰 reportId가 0일 전
  const date = new Date(NEWEST_REPORT_DATE_UTC - daysAgo * MS_PER_DAY);

  const year = String(date.getUTCFullYear()).slice(2);
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');

  return `${year}.${month}.${day}`;
};

// reportId가 클수록 최근 신고로 본다. → 목록은 최초 신고일시 내림차순(최신순)으로 보여준다.
const buildDummyReports = (targetType) => {
  const boardPattern =
    targetType === REPORT_TARGET_COMMENT ? COMMENT_BOARD_PATTERN : BOARD_PATTERN;

  return Array.from({ length: DUMMY_REPORT_COUNT }, (_, index) => {
    const reportId = index + 1;
    const boardName = boardPattern[index % boardPattern.length];
    const member = MEMBER_POOL[index % MEMBER_POOL.length];
    const date = formatDummyDate(reportId);
    const reports = buildReportLog(reportId, date);

    const isComment = targetType === REPORT_TARGET_COMMENT;
    // 댓글은 미리보기와 모달에 같은 댓글 내용이 들어가고,
    // 게시글은 미리보기가 본문 앞머리 · 모달이 제목이라 서로 다르다(같은 글의 제목과 본문이다).
    const post = POST_CONTENT_POOL[index % POST_CONTENT_POOL.length];
    const preview = isComment
      ? COMMENT_CONTENT_POOL[index % COMMENT_CONTENT_POOL.length]
      : post.body;

    return {
      reportId,
      targetType,
      // 신고 대상 자체의 id (게시글이면 postId, 댓글이면 commentId)
      targetId: reportId,
      // 링크로 이동할 원글. 댓글이면 댓글이 달린 글이다.
      postId: isComment ? ((reportId * 7) % 40) + 1 : reportId,
      boardName,
      // 목록 '대상 미리보기' 열 (15자로 잘라 보여준다)
      preview,
      // 모달 '신고 상세' 줄에 들어가는 대상 요약 (게시글이면 제목, 댓글이면 댓글 내용)
      summary: isComment ? preview : post.title,
      // author는 목록 '작성자' 열용, 나머지 둘은 모달의 대상 회원 표기용
      author: member.loginId,
      authorStudentId: member.studentId,
      authorName: member.name,
      // 대표 신고 사유 - 가장 먼저 들어온 신고의 사유를 보여준다
      reasonCode: reports[0].reasonCode,
      // 최초 신고일시 - 신고 목록 중 가장 이른 시각
      firstReportedAt: reports[0].reportedAt,
      createdAt: date,
      status: STATUS_PATTERN[index % STATUS_PATTERN.length],
      // 모달 '신고 목록'에 그대로 보여줄 접수 내역
      reports,
    };
  });
};

export const DUMMY_POST_REPORTS = buildDummyReports(REPORT_TARGET_POST);
export const DUMMY_COMMENT_REPORTS = buildDummyReports(REPORT_TARGET_COMMENT);
