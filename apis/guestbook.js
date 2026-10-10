// 방명록 — 공개 API (PM 2026-10-10). 로그인 없이 읽고 남긴다. 로그인한 본인·관리자는 고치고 지운다. 관리 화면은 apis/admin/guestbook.js
import axiosInstance from '@/apis/axiosInstance';

// 1. 방명록 (GET /api/guestbook?semester=) [PUBLIC]
//    응답: { currentSemester, semester, semesters[], maxLength, maxDrawings, drawingMaxKb,
//            notes: [{ noteId, displayName, isMine, canManage, state, content, font, ink, paper, align, tilt,
//                      drawings: [{ drawingId, imageUrl, posX, posY, widthPct, rotation }], createdAt, updatedAt }] }
//    semester 를 비우면 이번 학기. 관리자에게는 숨긴 글(state=hidden)도 온다. imageUrl 은 apiUrl() 로 감싸 <img src> 에
export const getGuestbook = async (semester) => {
  const response = await axiosInstance.get('/api/guestbook', { params: semester ? { semester } : {} });
  return response.data;
};

// 2. 남기기 (POST /api/guestbook) [PUBLIC — 로그인이면 user_id 가 붙는다]
//    요청: { displayName, content, font, ink, paper, align, drawings: [{ dataUrl(PNG data URL), posX, posY, widthPct, rotation }] }
//    응답: 201 저장된 글. 실패: 400 빈 내용·길이·그림 수/크기 / 429 cooldown 안 재작성
export const writeGuestbookNote = async (body) => {
  const response = await axiosInstance.post('/api/guestbook', body);
  return response.data;
};

// 3. 고치기 (PUT /api/guestbook/{noteId}) [MEMBER — 본인 또는 관리자]
//    요청은 남기기와 같다. drawings 의 기존 그림은 drawingId, 새 그림은 dataUrl. 목록에서 빠진 그림은 떼어진다
export const editGuestbookNote = async (noteId, body) => {
  const response = await axiosInstance.put(`/api/guestbook/${encodeURIComponent(noteId)}`, body);
  return response.data;
};

// 4. 지우기 (DELETE /api/guestbook/{noteId}) [MEMBER] — 내 글은 deleted, 관리자가 남의 글을 지우면 hidden(복원 가능)
export const deleteGuestbookNote = async (noteId) => {
  const response = await axiosInstance.delete(`/api/guestbook/${encodeURIComponent(noteId)}`);
  return response.data;
};

// 5. 숨긴 글 복원 (PATCH /api/guestbook/{noteId}/restore) [ADMIN]
export const restoreGuestbookNote = async (noteId) => {
  const response = await axiosInstance.patch(`/api/guestbook/${encodeURIComponent(noteId)}/restore`);
  return response.data;
};
