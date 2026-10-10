// 관리자 - 운영 관리 > 방명록 관리 API (PM 2026-10-10)
import axiosInstance from '@/apis/axiosInstance';

// 1. 학기별 글 전부 (GET /api/admin/guestbook/notes?semester=) [ADMIN]
//    응답: { semester, semesters[], notes: [{ ..., state: 'normal'|'hidden'|'deleted' }] } — 숨긴 글·지운 글 포함
export const getAdminGuestbookNotes = async (semester) => {
  const response = await axiosInstance.get('/api/admin/guestbook/notes', { params: semester ? { semester } : {} });
  return response.data;
};

// 2. 글 숨기기 / 복원 (PATCH /api/admin/guestbook/notes/{noteId}/hide|restore) [ADMIN]
export const hideGuestbookNote = async (noteId) => {
  const response = await axiosInstance.patch(`/api/admin/guestbook/notes/${encodeURIComponent(noteId)}/hide`);
  return response.data;
};
export const restoreGuestbookNote = async (noteId) => {
  const response = await axiosInstance.patch(`/api/admin/guestbook/notes/${encodeURIComponent(noteId)}/restore`);
  return response.data;
};

// 3. 스티커 목록 (GET /api/admin/guestbook/stickers) [ADMIN] — [{ stickerId, name, imageUrl, sortOrder }]
export const getGuestbookStickers = async () => {
  const response = await axiosInstance.get('/api/admin/guestbook/stickers');
  return response.data;
};

// 4. 스티커 등록 (POST /api/admin/guestbook/stickers) [ADMIN] — multipart file + name. 201 스티커
export const createGuestbookSticker = async (file, name) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('name', name);
  const response = await axiosInstance.post('/api/admin/guestbook/stickers', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 2 * 60 * 1000,
  });
  return response.data;
};

// 5. 스티커 이름·순서 (PUT /api/admin/guestbook/stickers/{stickerId}) [ADMIN] — { name, sortOrder }
export const updateGuestbookSticker = async (stickerId, { name, sortOrder }) => {
  const response = await axiosInstance.put(`/api/admin/guestbook/stickers/${encodeURIComponent(stickerId)}`, { name, sortOrder });
  return response.data;
};

// 6. 스티커 삭제 (DELETE /api/admin/guestbook/stickers/{stickerId}) [ADMIN] — 소프트. 이미 붙은 글에는 계속 보인다
export const deleteGuestbookSticker = async (stickerId) => {
  const response = await axiosInstance.delete(`/api/admin/guestbook/stickers/${encodeURIComponent(stickerId)}`);
  return response.data;
};
