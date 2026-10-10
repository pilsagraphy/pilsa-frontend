// 활동 사진 — 공개 조회 + 회원 업로드/삭제 (PM 2026-10-10 밤). 관리 화면은 apis/admin/gallery.js
import axiosInstance from '@/apis/axiosInstance';

// 1. 활동 사진 (GET /api/gallery?semester=) [PUBLIC]
//    응답: { currentSemester, semester, semesters[], maxFilesPerUpload,
//            photos: [{ photoId, semesterLabel, userId, uploaderName, imageUrl, ratio, title, hashtags[], isMine, canManage, state, createdAt }] }
//    imageUrl 이 /api/.. 면 서버 사진(apiUrl 로 감싼다), /images/.. 면 프론트 정적 파일. 관리자에게는 숨긴 사진(hidden)도 온다
export const getGallery = async (semester) => {
  const response = await axiosInstance.get('/api/gallery', { params: semester ? { semester } : {} });
  return response.data;
};

// 2. 올리기 (POST /api/user/gallery) [MEMBER] — multipart files[] + ratios[](가로÷세로) + title + hashtags. 201 [사진...]
export const uploadGalleryPhotos = async (files, ratios, { title, hashtags } = {}) => {
  const formData = new FormData();
  files.forEach((file) => formData.append('files', file));
  (ratios ?? []).forEach((r) => formData.append('ratios', String(r)));
  if (title) formData.append('title', title);
  if (hashtags) formData.append('hashtags', hashtags);
  const response = await axiosInstance.post('/api/user/gallery', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 5 * 60 * 1000,
  });
  return response.data;
};

// 3. 지우기 (DELETE /api/user/gallery/{photoId}) [MEMBER] — 내 사진 deleted, 관리자가 남의 사진이면 hidden(복원 가능)
export const deleteGalleryPhoto = async (photoId) => {
  const response = await axiosInstance.delete(`/api/user/gallery/${encodeURIComponent(photoId)}`);
  return response.data;
};
