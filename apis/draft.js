// 공통게시판 임시저장(초안) 관련 API 처리
// ※ 게시판별 최대 5개 (policy_settings.draft_max_count, DB 가 물리 강제)
import axiosInstance from '@/apis/axiosInstance';

// 1. 임시저장 목록 (GET /api/user/boards/{boardId}/drafts) [MEMBER]
//    쿼리: limit (선택, 기본 전체)
//    응답: { drafts: [{ draftId, title, preview, attachCnt, updatedAt }] }
//    count 필드 없음 — 개수는 drafts.length. 본인 것만, updatedAt DESC
//    attachCnt 는 일반 첨부만 (본문 인라인 이미지 제외)
export const getDrafts = async (boardId, limit) => {
  const response = await axiosInstance.get(`/api/user/boards/${boardId}/drafts`, {
    params: limit === undefined ? {} : { limit },
  });
  return response.data;
};

// 2. 임시저장 생성 (POST /api/user/boards/{boardId}/drafts) [MEMBER]
//    요청: { title, content, categoryId, isAnonymous, attachmentIds[] }
//    응답: { message, draftId }
//    title·content 둘 다 비면 400. 본문에 남은 /api/user/files/{id} 는 서버가 함께 보존
//    실패: 409 '임시저장은 최대 5개까지 보관할 수 있습니다.'
export const createDraft = async (boardId, body) => {
  const response = await axiosInstance.post(`/api/user/boards/${boardId}/drafts`, body);
  return response.data;
};

// 3. 임시저장 단건 조회 - 이어쓰기 (GET /api/user/boards/{boardId}/drafts/{draftId}) [MEMBER]
//    응답: { draftId, title, content, categoryId, isAnonymous, updatedAt, attachments[] }
//    attachments 는 일반 첨부만 — 인라인 이미지는 content 마크다운 안에 이미 있다
//    남의 초안·다른 게시판이면 404
export const getDraft = async (boardId, draftId) => {
  const response = await axiosInstance.get(`/api/user/boards/${boardId}/drafts/${draftId}`);
  return response.data;
};

// 4. 임시저장 덮어쓰기 (PUT /api/user/boards/{boardId}/drafts/{draftId}) [MEMBER]
//    요청: { title, content, categoryId, isAnonymous, attachmentIds[] }
//    응답: { message } — 슬롯 유지, updatedAt 만 갱신
//    attachmentIds 는 '이번 저장이 유지할 첨부 전체'다 — 빠진 것은 서버가 파일까지 삭제
//    → 화면에서 X 한 첨부는 다음 저장에서 id 만 빼면 된다 (별도 삭제 호출 불필요)
export const updateDraft = async (boardId, draftId, body) => {
  const response = await axiosInstance.put(`/api/user/boards/${boardId}/drafts/${draftId}`, body);
  return response.data;
};

// 5. 임시저장 삭제 (DELETE /api/user/boards/{boardId}/drafts/{draftId}) [MEMBER]
//    응답: { message } — 물리 삭제 (DB 행 + 디스크 파일까지)
export const deleteDraft = async (boardId, draftId) => {
  const response = await axiosInstance.delete(`/api/user/boards/${boardId}/drafts/${draftId}`);
  return response.data;
};

// 6. (연동 메모) 초안 → 발행
//    별도 API 가 없다. board.js 의 게시글 등록에 draftId 를 실어 보내면
//    발행 성공과 같은 트랜잭션에서 초안이 삭제된다
