// 관리자 - 메뉴 관리 > 활동 사진 관리 API (PM 2026-10-10 밤)
import axiosInstance from '@/apis/axiosInstance';

// 1. 학기별 사진 전부 (GET /api/admin/gallery/photos?semester=&keyword=) [ADMIN] — 숨긴 사진 포함 { semester, semesters[], photos[] }. keyword 가 있으면 학기 무시(제목·해시태그·올린 사람 이름·아이디)
export const getAdminGalleryPhotos = async (semester, keyword) => {
  const response = await axiosInstance.get('/api/admin/gallery/photos', { params: { ...(semester ? { semester } : {}), ...(keyword ? { keyword } : {}) } });
  return response.data;
};

// 2. 숨기기 / 복원 (PATCH /api/admin/gallery/photos/{photoId}/hide|restore) [ADMIN]
export const hideGalleryPhoto = async (photoId) => {
  const response = await axiosInstance.patch(`/api/admin/gallery/photos/${encodeURIComponent(photoId)}/hide`);
  return response.data;
};
export const restoreGalleryPhoto = async (photoId) => {
  const response = await axiosInstance.patch(`/api/admin/gallery/photos/${encodeURIComponent(photoId)}/restore`);
  return response.data;
};

// 3. 제목·해시태그 수정 (PUT /api/admin/gallery/photos/{photoId}) [ADMIN] — { title, hashtags(쉼표/공백 구분) } → 바뀐 사진
export const updateGalleryPhotoMeta = async (photoId, { title, hashtags }) => {
  const response = await axiosInstance.put(`/api/admin/gallery/photos/${encodeURIComponent(photoId)}`, { title, hashtags });
  return response.data;
};

// 4. 순서 바꾸기 (PUT /api/admin/gallery/photos/order) [ADMIN] — { semester, photoIds[] } 배열 순서가 곧 표시 순서. 그 학기 사진 id 전부를 보낸다 (10/11)
export const reorderGalleryPhotos = async (semester, photoIds) => {
  const response = await axiosInstance.put('/api/admin/gallery/photos/order', { semester, photoIds });
  return response.data;
};

// 5. 등록 정보 수정 (PUT /api/admin/gallery/photos/{photoId}/registration) [ADMIN] — { semesterLabel, userId|null } (10/11)
export const updateGalleryPhotoRegistration = async (photoId, body) => {
  const response = await axiosInstance.put(`/api/admin/gallery/photos/${encodeURIComponent(photoId)}/registration`, body);
  return response.data;
};
