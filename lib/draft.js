// 임시저장(초안) 공통 유틸

// 보관 상한(게시판별 5개)은 여기에 두지 않는다.
// DB(drafts.slot_no 1~5 + UNIQUE)가 물리 강제하고, 넘으면 서버가 409 와 함께
// 사용자용 문장을 내려준다. 프론트에서 같은 숫자를 또 들고 있으면
// policy_settings.draft_max_count 가 바뀔 때 조용히 어긋난다.

// 목록에 쓰는 'YY.MM.DD' 형식 (시안).
// 초안에는 updatedAt(마지막 저장 시각)만 내려온다 — 이어쓰기 판단 기준이다.
export function formatDraftDate(value) {
  if (!value) return '';

  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);

  const p = (n) => String(n).padStart(2, '0');
  return `${p(d.getFullYear() % 100)}.${p(d.getMonth() + 1)}.${p(d.getDate())}`;
}

// 생성(POST)·덮어쓰기(PUT) 요청 본문. 두 API 가 같은 형태를 받는다.
//  - 카테고리는 선택 사항이라 고르지 않았으면 키를 아예 넣지 않는다
//  - attachmentIds 는 '이번 저장이 유지할 첨부 전체'다.
//    빠진 것은 서버가 DB 행과 파일까지 지우므로 별도 삭제 호출이 필요 없다.
//  - 본문 삽입 이미지는 여기 넣지 않는다. 마크다운에 남은 /api/user/files/{id} 를
//    서버가 훑어 함께 보존한다 (발행과 같은 규칙).
export function buildDraftBody({ title, content, categoryId, isAnonymous, attachmentIds = [] }) {
  const body = {
    title: (title ?? '').trim(),
    content: (content ?? '').trim(),
    isAnonymous: Boolean(isAnonymous),
    attachmentIds,
  };

  if (categoryId !== '' && categoryId != null) {
    body.categoryId = Number(categoryId);
  }

  return body;
}

// 제목·내용이 둘 다 비면 서버가 400 을 준다. 요청을 보내기 전에 걸러낸다.
export function isDraftEmpty(title, content) {
  return !(title ?? '').trim() && !(content ?? '').trim();
}

// 자동저장 주기.
export const AUTO_SAVE_INTERVAL_MS = 30000;

// 마지막으로 저장한 내용과 같은지 비교할 지문.
// 고친 것이 없으면 요청을 보내지 않기 위한 것이다 (30초마다 같은 내용을 또 보내지 않는다).
export function draftSignature(body) {
  return JSON.stringify({
    title: body.title,
    content: body.content,
    categoryId: body.categoryId ?? null,
    isAnonymous: body.isAnonymous,
    attachmentIds: [...(body.attachmentIds ?? [])].sort((a, b) => a - b),
  });
}
