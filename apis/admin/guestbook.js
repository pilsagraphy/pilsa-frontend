// 관리자 - 운영 관리 > 방명록 관리 API (PM 2026-10-10). 스티커는 작성자가 직접 그리므로 관리자 등록 API 는 없다
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
