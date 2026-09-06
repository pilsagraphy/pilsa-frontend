// 관리자 - 신고 관리(게시글 신고 · 댓글 신고)
// 목록 · 조치는 apis/admin/reports.js 를 통해 서버에서 받아온다.

import { getCommentAnchorId } from '@/lib/utils';
import { ROUTES } from '@/constants/routes';
import { REPORT_REASONS } from './report';

// ── 탭 ────────────────────────────────────────────────────────────────
// 두 탭의 표 구조(열 구성)가 완전히 같고 대상 종류만 다르다.
// 값은 서버의 targetType 과 같은 문자열이어야 한다 (그대로 쿼리·요청에 실어 보낸다).
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
// 기획: 신고가 접수되면 그 글·댓글은 곧바로 블라인드 처리되어 사용자 게시판에서 사라진다.
// 관리자는 신고 관리 페이지에서 복원 또는 삭제를 선택하고, 어느 쪽이든 목록에는 남는다.
//  - 신고 접수 직후  → '블라인드' (사용자에게 안 보임)
//  - 관리자가 복원    → '복원'     (블라인드가 풀려 사용자에게 다시 보인다)
//  - 관리자가 삭제    → '삭제'     (소프트 삭제. 다시 복원하면 되살아난다)
//
// ★기획상 '공개'는 이 목록에 나올 수 없지만, 서버가 아직 자동 블라인드를 적용하지 않아
//  신고가 접수된 채로 state=normal 인 대상이 내려온다(확인 2026-09-06: 157·140번 게시글).
//  그 행을 '블라인드'로 보여주면 관리자는 가려진 줄 알지만 실제로는 사용자에게 계속 보인다.
//  화면이 서버 상태를 있는 그대로 말하도록 '공개'로 표시한다 — 자동 블라인드가 적용되면
//  state 가 blind 로 내려와 '공개' 행은 자연히 사라진다. → 백엔드 협의 항목 (README 7번)
//
// 서버가 주는 값은 두 종류다. 상태 하나를 정하려면 둘을 함께 봐야 한다.
//  - state        : 대상(글·댓글) 자체의 표시 상태. normal | blind | deleted
//  - reportStatus : 신고 건의 처리 여부. pending | resolved (| rejected)
export const REPORT_STATES = {
  NORMAL: 'normal',
  BLIND: 'blind',
  DELETED: 'deleted',
};

// 서버 명세상 복원은 pending 신고를 rejected 로 끝낸다. 다만 삭제 조치로 이미 resolved 가 된
// 대상을 복원하면 끝낼 pending 이 없어 resolved 로 남는다(확인: 158번 게시글).
// 둘 다 '관리자가 처리를 끝냈다'는 뜻이라 함께 본다.
const CLOSED_REPORT_STATUSES = ['resolved', 'rejected'];

export const REPORT_STATUSES = {
  PUBLIC: '공개',
  BLINDED: '블라인드',
  RESTORED: '복원',
  DELETED: '삭제',
};

// 목록 '상태' 열에 보여줄 이름. state(글이 보이는지)와 reportStatus(신고를 처리했는지)를 함께 본다.
//   삭제됨                          → '삭제'
//   글은 공개인데 신고는 종료됨      → '복원'   (관리자가 되돌린 것)
//   글은 공개인데 신고는 처리 전     → '공개'   (자동 블라인드 미적용 — 위 ★ 참고)
//   그 밖(blind)                    → '블라인드'
export const getReportStatusLabel = (report) => {
  if (report?.state === REPORT_STATES.DELETED) return REPORT_STATUSES.DELETED;

  if (report?.state === REPORT_STATES.NORMAL) {
    return CLOSED_REPORT_STATUSES.includes(report?.reportStatus)
      ? REPORT_STATUSES.RESTORED
      : REPORT_STATUSES.PUBLIC;
  }

  return REPORT_STATUSES.BLINDED;
};

export const STATUS_FILTER_ALL = 'all';

// ★상태 필터로 서버가 인식하는 값은 blind · deleted 뿐이다 (state=normal 은 무시되고 전체가 온다).
//  '복원'만 골라 보는 필터는 서버가 지원하지 않아 선택지에 두지 못한다 → 백엔드 협의 항목
export const STATUS_FILTER_OPTIONS = [
  { value: STATUS_FILTER_ALL, label: '상태 전체' },
  { value: REPORT_STATES.BLIND, label: REPORT_STATUSES.BLINDED },
  { value: REPORT_STATES.DELETED, label: REPORT_STATUSES.DELETED },
];

// 관리자가 취할 수 있는 조치. 값은 apis/admin/reports.js 의 REPORT_ACTION_REQUESTS 키와 같다
// (시안 일부에 '반려'로 적힌 것이 있으나 '복원'으로 통일한다 — 서버 API 도 select-restore 다)
export const REPORT_ACTION_RESTORE = 'restore';
export const REPORT_ACTION_DELETE = 'delete';

// 목록의 관리 열 버튼 · 선택 액션 버튼 · 처리 모달 · 안내 문구에 모두 같은 이름을 쓴다.
export const REPORT_ACTION_LABELS = {
  [REPORT_ACTION_RESTORE]: '복원',
  [REPORT_ACTION_DELETE]: '삭제',
};

// ── 게시판 필터 ───────────────────────────────────────────────────────
// 서버는 boardId 로 거른다. 선택지는 게시판 목록 API(useBoardStore)에서 만들어
// 게시판이 새로 생겨도 따라오게 한다 — 하드코딩 금지.
export const BOARD_FILTER_ALL = 'all';

export const buildBoardFilterOptions = (boards) => [
  { value: BOARD_FILTER_ALL, label: '전체 게시판' },
  ...(boards ?? []).map(({ boardId, boardName }) => ({
    value: String(boardId),
    label: boardName,
  })),
];

// ── 정렬 ──────────────────────────────────────────────────────────────
// 서버가 받는 값은 latest(최신순) 하나뿐이다. 시안의 드롭다운 자리를 지키기 위해 선택지 하나로 둔다.
export const REPORT_SORT_LATEST = 'latest';
export const REPORT_SORT_OPTIONS = [{ value: REPORT_SORT_LATEST, label: '최신순' }];

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

// 서버의 LocalDateTime('2026-08-14T10:00:00') → 시안 표기('26.08.14 10:00').
// new Date() 로 파싱하면 서버 시각을 UTC 로 읽어 9시간 밀리는 브라우저가 있어 문자열을 그대로 자른다
// (서버 값에 타임존이 붙어 있지 않으므로 한국 시각으로 그대로 보여주는 것이 맞다).
export const formatReportedAt = (value) => {
  if (!value) return '-';

  const matched = /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})/.exec(value);
  if (!matched) return value;

  const [, year, month, day, hour, minute] = matched;
  return `${year.slice(2)}.${month}.${day} ${hour}:${minute}`;
};

// ── 신고 사유 ─────────────────────────────────────────────────────────
// 조치 모달의 사유 셀렉트는 code('SPAM')를 넘기는데 서버는 reasonId(1)를 받는다.
// TODO: 사유 목록을 GET /api/user/reports/reasons 로 받아오면 reasonId 가 바로 들어와
//       이 변환이 필요 없어진다. 그 셀렉트는 사용자용 신고 모달과 공유하는 컴포넌트라
//       영향 범위가 넓어서 별도 작업으로 분리했다.
const REASON_ID_BY_CODE = Object.fromEntries(
  REPORT_REASONS.map(({ code, reasonId }) => [code, reasonId])
);

// 모르는 코드면 null 을 준다 — 서버는 reasonId 가 없으면 대표(최신) 신고 사유를 쓴다
export const getReasonIdByCode = (code) => REASON_ID_BY_CODE[code] ?? null;

// ── 신고자 별칭 ───────────────────────────────────────────────────────
// 신고자는 공개하지 않는 정책이라(사용자 신고 모달: '신고자 정보는 공개되지 않습니다')
// 서버는 신고자 정보를 주지 않는다. 대상별 신고 내역을 신고일시 오름차순으로 받아
// 그 순서대로 프론트가 별칭을 붙인다 — 최초 신고자가 익명A다.
//
// 별칭이 대상 안에서만 유효한 이름인 점을 주의할 것. 다른 대상의 '익명A'는 다른 사람이다.
// (그래서 조치 모달은 여러 대상의 신고를 한 표에 섞지 않고 대상마다 표를 나눈다)
const REPORTER_ALIAS_LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

export const getReporterAlias = (index) =>
  index < REPORTER_ALIAS_LETTERS.length
    ? `익명${REPORTER_ALIAS_LETTERS[index]}`
    : // 한 대상에 신고가 26건을 넘으면 글자가 떨어진다. 그때는 번호로 잇는다
      `익명${index + 1}`;

// ── 대상 링크 ─────────────────────────────────────────────────────────
// 게시글이면 그 글로, 댓글이면 댓글이 달린 원글 + 댓글 앵커(#comment-{id})로 이동한다.
// 댓글은 별도 상세 페이지가 없어서 해시로만 특정할 수 있다.
// 갈 곳이 없으면 null → 행에서는 링크 대신 텍스트로 보여준다.
//
// allowComment 는 게시판 목록 API 의 플래그다. 댓글 영역이 없는 게시판(공지사항 등)으로
// 보내면 '이동은 했는데 문제의 댓글이 없는' 화면이 되므로 아예 링크를 걸지 않는다.
export const getReportTargetHref = (report, allowComment = true) => {
  if (report.boardId == null || report.postId == null) return null;

  const postHref = ROUTES.BOARD_POST(report.boardId, report.postId);
  if (report.targetType !== REPORT_TARGET_COMMENT) return postHref;
  if (!allowComment) return null;

  return `${postHref}#${getCommentAnchorId(report.targetId)}`;
};

// ── 조치 가능 여부 ────────────────────────────────────────────────────
// 복원은 어떤 상태에서도 할 수 있다 - 블라인드는 해제하고, 삭제는 되살린다.
// PATCH /api/admin/reports/select-restore가 '복원 = 모든 조치의 되돌리기'로, 삭제된 대상도
// 되살리고 부과됐던 주의 포인트까지 회수한다. 그래서 복원을 막는 술어는 두지 않는다.
// 이미 공개 상태라 되돌릴 것이 없는 경우는 서버가 failures로 걸러 알려준다.

// 이미 삭제된 것을 다시 삭제하는 것은 아무 일도 하지 않는 조치다.
export const isDeletable = (report) => report.state !== REPORT_STATES.DELETED;
