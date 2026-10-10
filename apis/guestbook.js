// 방명록 — 공개 API (PM 2026-10-10). 로그인 없이 읽고 남긴다. 관리(숨김·스티커)는 apis/admin/guestbook.js
import axiosInstance from '@/apis/axiosInstance';

// 1. 방명록 (GET /api/guestbook?semester=) [PUBLIC]
//    응답: { currentSemester, semester, semesters[], maxLength, maxStickers,
//            stickers: [{ stickerId, name, imageUrl, sortOrder }],
//            notes: [{ noteId, displayName, isMember, isMine, content, ink, paper, tilt,
//                      stickers: [{ stickerId, slot, name, imageUrl }], createdAt }] }
//    semester 를 비우면 이번 학기. imageUrl(/api/guestbook/stickers/{id}/image)은 apiUrl() 로 감싸 <img src> 에
export const getGuestbook = async (semester) => {
  const response = await axiosInstance.get('/api/guestbook', { params: semester ? { semester } : {} });
  return response.data;
};

// 2. 남기기 (POST /api/guestbook) [PUBLIC — 로그인이면 asMember 가능]
//    요청: { displayName, asMember, content, ink('ink'|'gray'|'pencil'), paper('plain'|'cream'|'lined'), stickerIds[] }
//    응답: 201 저장된 글. 실패: 400 빈 내용·길이·스티커 수 / 429 cooldown 안 재작성
export const writeGuestbookNote = async (body) => {
  const response = await axiosInstance.post('/api/guestbook', body);
  return response.data;
};

// 3. 내 글 지우기 (DELETE /api/guestbook/{noteId}) [MEMBER] — 회원 이름으로 남긴 내 글만. 소프트
export const deleteGuestbookNote = async (noteId) => {
  const response = await axiosInstance.delete(`/api/guestbook/${encodeURIComponent(noteId)}`);
  return response.data;
};
